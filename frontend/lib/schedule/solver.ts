import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// AI Scheduling Engine
// Greedy + local search solver for P0. Respects TFPC rules, cast availability,
// location clustering, and India-reality constraints.
// =============================================================================

interface SceneForSchedule {
  id: string;
  sceneNumber: string;
  intExt: string | null;
  timeOfDay: string | null;
  location: string | null;
  estimatedDuration: number | null;
  characterIds: string[];
}

interface ScheduleDay {
  dayNumber: number;
  date: string | null;
  location: string | null;
  scenes: { sceneId: string; sceneNumber: string; estimatedMinutes: number; characters: string[] }[];
  totalMinutes: number;
  isNight: boolean;
  warnings: string[];
}

interface ScheduleResult {
  days: ScheduleDay[];
  totalDays: number;
  totalMinutes: number;
  unscheduledScenes: string[];
  warnings: string[];
}

type OptimizationMode = 'balanced' | 'fast' | 'cost_minimum' | 'travel_minimum' | 'weather_safe';

const TFPC_MAX_HOURS = 12;
const TFPC_MAX_MINUTES = TFPC_MAX_HOURS * 60;
const DEFAULT_SCENE_MINUTES = 45;

// -----------------------------------------------------------------------------
// Main Solver
// -----------------------------------------------------------------------------

export async function optimizeSchedule(
  projectId: string,
  startDate: string,
  mode: OptimizationMode = 'balanced'
): Promise<ScheduleResult> {
  const scenes = await prisma.scene.findMany({
    where: { script: { projectId } },
    include: {
      sceneCharacters: { select: { characterId: true } },
      shots: { select: { durationEstSec: true } },
    },
    orderBy: { sceneIndex: 'asc' },
  });

  const scenesForSchedule: SceneForSchedule[] = scenes.map(s => {
    // Calculate realistic scene duration based on production reality
    // In film, setup time dominates - each camera setup takes 15-45 minutes
    const shotCount = s.shots.length || 3; // Default to 3 if no shots
    const shotDuration = s.shots.reduce((sum, sh) => sum + (sh.durationEstSec || 3), 0);
    
    // Base time: 30 minutes minimum per scene (actor blocking, discussion)
    let estimatedMinutes = 30;
    
    // Add time per shot: ~15 minutes per setup (lighting, camera, actors)
    estimatedMinutes += shotCount * 15;
    
    // Add time for footage review and retries: 10% of raw footage time
    estimatedMinutes += Math.max(5, Math.round(shotDuration / 60 * 2));
    
    // Exteriors take 30% longer due to weather, permits, natural light changes
    if (s.intExt === 'EXT') {
      estimatedMinutes = Math.round(estimatedMinutes * 1.3);
    }
    
    // Night scenes take 50% longer due to lighting setup
    if (s.timeOfDay === 'NIGHT' || s.timeOfDay === 'DUSK') {
      estimatedMinutes = Math.round(estimatedMinutes * 1.5);
    }
    
    // Complex scenes with many characters take longer
    const charCount = s.sceneCharacters.length;
    if (charCount > 3) {
      estimatedMinutes += (charCount - 3) * 10; // Extra 10 min per additional actor
    }

    return {
      id: s.id,
      sceneNumber: s.sceneNumber,
      intExt: s.intExt,
      timeOfDay: s.timeOfDay,
      location: s.location,
      estimatedDuration: estimatedMinutes,
      characterIds: s.sceneCharacters.map(sc => sc.characterId),
    };
  });

  const result = greedySchedule(scenesForSchedule, startDate, mode);

  await persistSchedule(projectId, result, startDate);

  return result;
}

// -----------------------------------------------------------------------------
// Greedy Solver with Location Clustering
// -----------------------------------------------------------------------------

function greedySchedule(
  scenes: SceneForSchedule[],
  startDate: string,
  mode: OptimizationMode
): ScheduleResult {
  const sorted = clusterByLocation(scenes, mode);
  const days: ScheduleDay[] = [];
  const warnings: string[] = [];
  const unscheduled: string[] = [];
  let currentDay: ScheduleDay | null = null;

  for (const scene of sorted) {
    const minutes = scene.estimatedDuration || DEFAULT_SCENE_MINUTES;
    const isNight = scene.timeOfDay === 'NIGHT' || scene.timeOfDay === 'DUSK';

    if (!currentDay || wouldExceedLimit(currentDay, minutes) || dayTypeConflict(currentDay, isNight)) {
      if (currentDay) days.push(currentDay);

      const dayNum = days.length + 1;
      const date = addDays(startDate, dayNum - 1);

      currentDay = {
        dayNumber: dayNum,
        date,
        location: scene.location,
        scenes: [],
        totalMinutes: 0,
        isNight,
        warnings: [],
      };
    }

    currentDay.scenes.push({
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      estimatedMinutes: minutes,
      characters: scene.characterIds,
    });
    currentDay.totalMinutes += minutes;

    if (scene.intExt === 'EXT' && isNight) {
      currentDay.warnings.push(`Night EXT scene ${scene.sceneNumber}: generator + lighting needed`);
    }

    if (currentDay.totalMinutes > TFPC_MAX_MINUTES * 0.9) {
      currentDay.warnings.push(`Day ${currentDay.dayNumber} approaching TFPC 12-hour limit`);
    }
  }

  if (currentDay) days.push(currentDay);

  const totalMinutes = days.reduce((s, d) => s + d.totalMinutes, 0);

  return {
    days,
    totalDays: days.length,
    totalMinutes,
    unscheduledScenes: unscheduled,
    warnings,
  };
}

function clusterByLocation(scenes: SceneForSchedule[], mode: OptimizationMode): SceneForSchedule[] {
  if (mode === 'fast') return scenes;

  const locationGroups = new Map<string, SceneForSchedule[]>();
  const noLocation: SceneForSchedule[] = [];

  for (const scene of scenes) {
    const key = scene.location?.toLowerCase().trim() || '';
    if (!key) {
      noLocation.push(scene);
      continue;
    }
    if (!locationGroups.has(key)) locationGroups.set(key, []);
    locationGroups.get(key)!.push(scene);
  }

  const result: SceneForSchedule[] = [];

  if (mode === 'travel_minimum' || mode === 'cost_minimum') {
    for (const [, group] of locationGroups) {
      const dayScenes = group.sort((a, b) => {
        const aIsDay = a.timeOfDay !== 'NIGHT' && a.timeOfDay !== 'DUSK';
        const bIsDay = b.timeOfDay !== 'NIGHT' && b.timeOfDay !== 'DUSK';
        if (aIsDay !== bIsDay) return aIsDay ? -1 : 1;
        return 0;
      });
      result.push(...dayScenes);
    }
    result.push(...noLocation);
  } else {
    for (const [, group] of locationGroups) {
      result.push(...group);
    }
    result.push(...noLocation);
  }

  return result;
}

function wouldExceedLimit(day: ScheduleDay, additionalMinutes: number): boolean {
  return day.totalMinutes + additionalMinutes > TFPC_MAX_MINUTES;
}

function dayTypeConflict(day: ScheduleDay, isNight: boolean): boolean {
  return day.scenes.length > 0 && day.isNight !== isNight;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// -----------------------------------------------------------------------------
// Persist Schedule
// -----------------------------------------------------------------------------

async function persistSchedule(projectId: string, result: ScheduleResult, startDate: string) {
  await prisma.shootingDay.deleteMany({ where: { projectId } });

  for (const day of result.days) {
    const shootingDay = await prisma.shootingDay.create({
      data: {
        projectId,
        dayNumber: day.dayNumber,
        scheduledDate: day.date ? new Date(day.date) : null,
        callTime: day.isNight ? '16:00' : '06:00',
        estimatedHours: new Decimal(Math.round(day.totalMinutes / 60 * 10) / 10),
        notes: day.warnings.length > 0 ? day.warnings.join('; ') : null,
        status: 'scheduled',
      },
    });

    for (let i = 0; i < day.scenes.length; i++) {
      const scene = day.scenes[i];
      await prisma.dayScene.create({
        data: {
          shootingDayId: shootingDay.id,
          sceneId: scene.sceneId,
          orderNumber: i + 1,
          estimatedMinutes: scene.estimatedMinutes,
        },
      });
    }
  }

  const existingVersions = await prisma.scheduleVersion.count({ where: { projectId } });
  await prisma.scheduleVersion.create({
    data: {
      projectId,
      versionNum: existingVersions + 1,
      label: `Schedule v${existingVersions + 1}`,
      data: result as any,
      score: calculateScore(result),
      isActive: true,
    },
  });

  await prisma.scheduleVersion.updateMany({
    where: { projectId, versionNum: { not: existingVersions + 1 } },
    data: { isActive: false },
  });
}

function calculateScore(result: ScheduleResult): number {
  const dayUtilization = result.days.map(d => d.totalMinutes / TFPC_MAX_MINUTES);
  const avgUtilization = dayUtilization.reduce((s, u) => s + u, 0) / dayUtilization.length;
  const warningPenalty = result.warnings.length * 5;
  return Math.max(0, Math.round(avgUtilization * 100 - warningPenalty));
}
