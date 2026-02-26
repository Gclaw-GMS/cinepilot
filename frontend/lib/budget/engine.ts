import { prisma } from '@/lib/db';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis/cache';
import { runTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';
import {
  BudgetRefinementSchema,
  type BudgetRefinementResult,
} from '@/lib/ai/schemas';
import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// AI Budget Engine
// Stages: Cost Drivers → Baseline → AI Refinement → Benchmark → Persist
// =============================================================================

type ScaleType = 'micro' | 'indie' | 'mid' | 'big';

interface BudgetGenerateInput {
  projectId: string;
  region?: string;
  targetScale?: ScaleType;
  budgetCap?: number;
  overrides?: Record<string, number>;
}

interface CostDriverSummary {
  shootDays: number;
  locationCount: number;
  castCount: number;
  leadCount: number;
  supportingCount: number;
  nightExtDays: number;
  stuntDays: number;
  vfxCount: number;
  propsCount: number;
  sceneCount: number;
}

const REGIONAL_RATES: Record<string, Record<string, number>> = {
  'Tamil Nadu': {
    crewDailyAvg: 3500,
    cateringPerHead: 350,
    vehicleDailyRent: 4000,
    generatorDaily: 8000,
    hotelNight: 2500,
    permitAvg: 15000,
    locationDressing: 25000,
    editDayRate: 15000,
    diRate: 300000,
    soundMixRate: 150000,
  },
  'Chennai': {
    crewDailyAvg: 4000,
    cateringPerHead: 400,
    vehicleDailyRent: 4500,
    generatorDaily: 9000,
    hotelNight: 3500,
    permitAvg: 20000,
    locationDressing: 30000,
    editDayRate: 18000,
    diRate: 350000,
    soundMixRate: 180000,
  },
};

const SCALE_DEFAULTS: Record<ScaleType, { castLeadFee: number; crewSize: number; equipmentDaily: number; composerFee: number; contingencyPct: number }> = {
  micro: { castLeadFee: 500000, crewSize: 20, equipmentDaily: 15000, composerFee: 200000, contingencyPct: 0.15 },
  indie: { castLeadFee: 2000000, crewSize: 35, equipmentDaily: 35000, composerFee: 500000, contingencyPct: 0.12 },
  mid: { castLeadFee: 5000000, crewSize: 60, equipmentDaily: 75000, composerFee: 1500000, contingencyPct: 0.10 },
  big: { castLeadFee: 15000000, crewSize: 100, equipmentDaily: 150000, composerFee: 5000000, contingencyPct: 0.08 },
};

// -----------------------------------------------------------------------------
// Stage 1: Assemble Cost Drivers (Deterministic)
// -----------------------------------------------------------------------------

async function assembleCostDrivers(projectId: string): Promise<CostDriverSummary> {
  const [scenes, characters, props, vfxNotes, warnings, shots] = await Promise.all([
    prisma.scene.findMany({ where: { script: { projectId } } }),
    prisma.character.findMany({ where: { projectId } }),
    prisma.prop.findMany({ where: { projectId } }),
    prisma.vfxNote.findMany({ where: { scene: { script: { projectId } } } }),
    prisma.warning.findMany({ where: { scene: { script: { projectId } }, warningType: 'safety' } }),
    prisma.shot.findMany({ where: { scene: { script: { projectId } } } }),
  ]);

  const nightExtScenes = scenes.filter(s =>
    s.intExt === 'EXT' && (s.timeOfDay === 'NIGHT' || s.timeOfDay === 'SUNSET')
  );
  const stuntScenes = warnings.filter(w => w.description?.toLowerCase().includes('stunt'));

  const totalDuration = shots.reduce((sum, s) => sum + (s.durationEstSec || 3), 0);
  const estimatedShootDays = Math.max(
    10,
    Math.ceil(scenes.length / 3),
    Math.ceil(totalDuration / (8 * 60))
  );

  const uniqueLocations = new Set(scenes.map(s => s.location).filter(Boolean));
  const leads = characters.filter(c => c.isMain);

  return {
    shootDays: estimatedShootDays,
    locationCount: uniqueLocations.size,
    castCount: characters.length,
    leadCount: leads.length,
    supportingCount: characters.length - leads.length,
    nightExtDays: Math.ceil(nightExtScenes.length / 3),
    stuntDays: Math.ceil(stuntScenes.length / 2),
    vfxCount: vfxNotes.length,
    propsCount: props.length,
    sceneCount: scenes.length,
  };
}

// -----------------------------------------------------------------------------
// Stage 2: Baseline Cost Skeleton (Deterministic)
// -----------------------------------------------------------------------------

interface BudgetLineItem {
  category: string;
  subcategory?: string;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  rateLow: number;
  rateHigh: number;
  total: number;
  source: string;
  notes?: string;
}

function buildBaseline(
  drivers: CostDriverSummary,
  region: string,
  scale: ScaleType,
  overrides: Record<string, number>
): BudgetLineItem[] {
  const rates = REGIONAL_RATES[region] || REGIONAL_RATES['Tamil Nadu'];
  const scaleDefaults = SCALE_DEFAULTS[scale];
  const items: BudgetLineItem[] = [];

  const leadFee = overrides.hero_fee || scaleDefaults.castLeadFee;
  items.push({
    category: 'Cast', subcategory: 'Lead',
    description: `Lead cast fees (${drivers.leadCount} leads)`,
    quantity: Math.max(1, drivers.leadCount), unit: 'person', rate: leadFee,
    rateLow: leadFee * 0.8, rateHigh: leadFee * 1.2,
    total: Math.max(1, drivers.leadCount) * leadFee, source: 'formula',
  });

  items.push({
    category: 'Cast', subcategory: 'Supporting',
    description: `Supporting cast (${drivers.supportingCount} actors)`,
    quantity: drivers.supportingCount, unit: 'call days',
    rate: 5000 * drivers.shootDays * 0.5,
    rateLow: 3000 * drivers.shootDays * 0.4, rateHigh: 8000 * drivers.shootDays * 0.6,
    total: drivers.supportingCount * 5000 * Math.ceil(drivers.shootDays * 0.5),
    source: 'formula',
  });

  items.push({
    category: 'Crew', subcategory: 'Production',
    description: `Crew (${scaleDefaults.crewSize} members × ${drivers.shootDays} days)`,
    quantity: scaleDefaults.crewSize * drivers.shootDays, unit: 'person-days',
    rate: rates.crewDailyAvg, rateLow: rates.crewDailyAvg * 0.8, rateHigh: rates.crewDailyAvg * 1.3,
    total: scaleDefaults.crewSize * drivers.shootDays * rates.crewDailyAvg,
    source: 'formula',
  });

  items.push({
    category: 'Equipment', subcategory: 'Camera & Grip',
    description: `Equipment rental (${drivers.shootDays} days)`,
    quantity: drivers.shootDays, unit: 'days',
    rate: overrides.equipment_daily || scaleDefaults.equipmentDaily,
    rateLow: scaleDefaults.equipmentDaily * 0.8, rateHigh: scaleDefaults.equipmentDaily * 1.2,
    total: drivers.shootDays * (overrides.equipment_daily || scaleDefaults.equipmentDaily),
    source: 'formula',
  });

  if (drivers.nightExtDays > 0) {
    items.push({
      category: 'Equipment', subcategory: 'Generator',
      description: `Generator for ${drivers.nightExtDays} night EXT days`,
      quantity: drivers.nightExtDays, unit: 'days',
      rate: rates.generatorDaily, rateLow: rates.generatorDaily * 0.8, rateHigh: rates.generatorDaily * 1.5,
      total: drivers.nightExtDays * rates.generatorDaily,
      source: 'formula', notes: 'Night exteriors require generator + diesel',
    });
  }

  items.push({
    category: 'Locations', subcategory: 'Permits & Dressing',
    description: `${drivers.locationCount} locations`,
    quantity: drivers.locationCount, unit: 'locations',
    rate: rates.permitAvg + rates.locationDressing,
    rateLow: (rates.permitAvg + rates.locationDressing) * 0.6,
    rateHigh: (rates.permitAvg + rates.locationDressing) * 1.5,
    total: drivers.locationCount * (rates.permitAvg + rates.locationDressing),
    source: 'formula',
  });

  items.push({
    category: 'Travel & Stay',
    description: `Vehicles + fuel + hotels`,
    quantity: drivers.shootDays, unit: 'days',
    rate: rates.vehicleDailyRent * 3 + rates.hotelNight * 5,
    rateLow: (rates.vehicleDailyRent * 2 + rates.hotelNight * 3),
    rateHigh: (rates.vehicleDailyRent * 5 + rates.hotelNight * 10),
    total: drivers.shootDays * (rates.vehicleDailyRent * 3 + rates.hotelNight * 5),
    source: 'formula',
  });

  items.push({
    category: 'Catering',
    description: `${scaleDefaults.crewSize} crew × ${drivers.shootDays} days`,
    quantity: scaleDefaults.crewSize * drivers.shootDays, unit: 'meals',
    rate: rates.cateringPerHead, rateLow: rates.cateringPerHead * 0.8, rateHigh: rates.cateringPerHead * 1.3,
    total: scaleDefaults.crewSize * drivers.shootDays * rates.cateringPerHead,
    source: 'formula',
  });

  const editDays = Math.ceil(drivers.shootDays * 0.7);
  items.push({
    category: 'Post-Production', subcategory: 'Edit + DI + Sound',
    description: `Edit (${editDays} days) + DI + Sound Mix`,
    quantity: 1, unit: 'package',
    rate: editDays * rates.editDayRate + rates.diRate + rates.soundMixRate,
    rateLow: editDays * rates.editDayRate * 0.8 + rates.diRate * 0.8 + rates.soundMixRate * 0.8,
    rateHigh: editDays * rates.editDayRate * 1.2 + rates.diRate * 1.3 + rates.soundMixRate * 1.2,
    total: editDays * rates.editDayRate + rates.diRate + rates.soundMixRate,
    source: 'formula',
  });

  if (drivers.vfxCount > 0) {
    const vfxPerShot = scale === 'big' ? 100000 : scale === 'mid' ? 50000 : 20000;
    items.push({
      category: 'Post-Production', subcategory: 'VFX',
      description: `${drivers.vfxCount} VFX shots`,
      quantity: drivers.vfxCount, unit: 'shots',
      rate: vfxPerShot, rateLow: vfxPerShot * 0.5, rateHigh: vfxPerShot * 2,
      total: drivers.vfxCount * vfxPerShot,
      source: 'formula',
    });
  }

  items.push({
    category: 'Music',
    description: 'Composer + Studio + Musicians',
    quantity: 1, unit: 'package',
    rate: overrides.music_director_fee || scaleDefaults.composerFee,
    rateLow: scaleDefaults.composerFee * 0.7, rateHigh: scaleDefaults.composerFee * 1.5,
    total: overrides.music_director_fee || scaleDefaults.composerFee,
    source: 'formula',
  });

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  items.push({
    category: 'Contingency',
    description: `${Math.round(scaleDefaults.contingencyPct * 100)}% contingency buffer`,
    quantity: 1, unit: 'lump',
    rate: subtotal * scaleDefaults.contingencyPct,
    rateLow: subtotal * scaleDefaults.contingencyPct * 0.5,
    rateHigh: subtotal * scaleDefaults.contingencyPct * 1.5,
    total: subtotal * scaleDefaults.contingencyPct,
    source: 'formula',
  });

  return items;
}

// -----------------------------------------------------------------------------
// Stage 3: AI Cost Refinement
// -----------------------------------------------------------------------------

async function aiRefine(
  drivers: CostDriverSummary,
  baseline: BudgetLineItem[],
  region: string,
  scale: ScaleType,
  overrides: Record<string, number>
): Promise<BudgetRefinementResult | null> {
  try {
    return await runTask<BudgetRefinementResult>(
      'budget.refinement',
      {
        currentBudget: JSON.stringify(baseline.map(i => ({
          category: i.category, subcategory: i.subcategory, description: i.description,
          quantity: i.quantity, rate: i.rate, total: i.total,
        }))),
        scriptBreakdown: JSON.stringify(drivers),
        benchmarks: `Region: ${region}, Scale: ${scale}. Overrides: ${JSON.stringify(overrides)}`,
      },
      PROMPTS.budget.refinement.system,
      PROMPTS.budget.refinement.user,
      BudgetRefinementSchema,
      { maxTokens: 8192 }
    );
  } catch (err) {
    console.warn('[Budget AI Refinement] Failed, using baseline only:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Full Budget Generation Pipeline
// -----------------------------------------------------------------------------

export async function generateBudget(input: BudgetGenerateInput) {
  const { projectId, region = 'Tamil Nadu', targetScale = 'mid', budgetCap, overrides = {} } = input;

  const drivers = await assembleCostDrivers(projectId);
  const baseline = buildBaseline(drivers, region, targetScale, overrides);
  const aiResult = await aiRefine(drivers, baseline, region, targetScale, overrides);

  const finalItems = aiResult?.refined_items || baseline.map(i => ({
    category: i.category, subcategory: i.subcategory, description: i.description,
    quantity: i.quantity, unit: i.unit, rate_low: i.rateLow, rate_high: i.rateHigh,
    total_low: i.total * 0.8, total_high: i.total * 1.2, source: i.source, notes: i.notes,
  }));

  await prisma.budgetItem.deleteMany({ where: { projectId, source: { in: ['formula', 'ai'] } } });

  for (const item of finalItems) {
    const avgRate = ((item.rate_low || 0) + (item.rate_high || 0)) / 2;
    const avgTotal = ((item.total_low || 0) + (item.total_high || 0)) / 2;

    await prisma.budgetItem.create({
      data: {
        projectId,
        category: item.category,
        subcategory: item.subcategory || null,
        description: item.description,
        quantity: new Decimal(item.quantity),
        unit: item.unit || null,
        rate: new Decimal(avgRate),
        rateLow: new Decimal(item.rate_low),
        rateHigh: new Decimal(item.rate_high),
        total: new Decimal(avgTotal),
        source: item.source || 'ai',
        notes: item.notes || null,
      },
    });
  }

  const totalPlanned = finalItems.reduce((s, i) => s + ((i.total_low + i.total_high) / 2), 0);

  await prisma.aiAnalysis.create({
    data: {
      projectId,
      analysisType: 'budget_generation',
      result: {
        drivers,
        totalPlanned,
        region,
        scale: targetScale,
        risks: aiResult?.risks || [],
        questions: aiResult?.questions_for_user || [],
        itemCount: finalItems.length,
      } as any,
      modelUsed: 'gpt-4o',
    },
  });

  return {
    items: finalItems,
    totalPlanned: Math.round(totalPlanned),
    drivers,
    risks: aiResult?.risks || [],
    questions: aiResult?.questions_for_user || [],
  };
}

// -----------------------------------------------------------------------------
// Forecasting (EAC)
// -----------------------------------------------------------------------------

export async function forecastBudget(projectId: string) {
  const [items, expenses] = await Promise.all([
    prisma.budgetItem.findMany({ where: { projectId } }),
    prisma.expense.findMany({ where: { projectId } }),
  ]);

  const planned = items.reduce((s, i) => s + Number(i.total || 0), 0);
  const actual = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const categoryBreakdown: Record<string, { planned: number; actual: number }> = {};
  for (const item of items) {
    if (!categoryBreakdown[item.category]) categoryBreakdown[item.category] = { planned: 0, actual: 0 };
    categoryBreakdown[item.category].planned += Number(item.total || 0);
  }
  for (const exp of expenses) {
    if (!categoryBreakdown[exp.category]) categoryBreakdown[exp.category] = { planned: 0, actual: 0 };
    categoryBreakdown[exp.category].actual += Number(exp.amount);
  }

  const categoryForecasts = Object.entries(categoryBreakdown).map(([cat, data]) => {
    const ratio = data.planned > 0 ? data.actual / data.planned : 0;
    const forecast = ratio > 0 ? data.planned * Math.max(ratio, 1) : data.planned;
    return {
      category: cat,
      planned: Math.round(data.planned),
      actual: Math.round(data.actual),
      forecast: Math.round(forecast),
      status: data.actual > data.planned ? 'over' as const : data.actual > data.planned * 0.8 ? 'warning' as const : 'on_track' as const,
    };
  });

  const eacTotal = categoryForecasts.reduce((s, c) => s + c.forecast, 0);
  const variance = eacTotal - planned;

  return {
    planned: Math.round(planned),
    actual: Math.round(actual),
    eacTotal: Math.round(eacTotal),
    variance: Math.round(variance),
    percentSpent: planned > 0 ? Math.round((actual / planned) * 100) : 0,
    categories: categoryForecasts,
  };
}

// -----------------------------------------------------------------------------
// Add Expense
// -----------------------------------------------------------------------------

export async function addExpense(
  projectId: string,
  data: { category: string; description: string; amount: number; date: string; vendor?: string; notes?: string }
) {
  return prisma.expense.create({
    data: {
      projectId,
      category: data.category,
      description: data.description,
      amount: new Decimal(data.amount),
      date: new Date(data.date),
      vendor: data.vendor || null,
      notes: data.notes || null,
    },
  });
}
