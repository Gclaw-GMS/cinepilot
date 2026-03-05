import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { jsPDF } from 'jspdf';

const DEFAULT_PROJECT_ID = 'default-project';

// PDF Generation helpers
function generateSchedulePDF(shootingDays: any[]): Buffer {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CinePilot Shooting Schedule', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  shootingDays.forEach((day: any, index: number) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    // Day header
    doc.setFillColor(99, 102, 241);
    doc.rect(15, yPos - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Day ${day.dayNumber} - ${day.scheduledDate || 'TBD'}`, 20, yPos);
    yPos += 12;
    
    // Day details
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const location = day.location?.name || day.location || 'TBD';
    const callTime = day.callTime || '06:00';
    const hours = day.estimatedHours || 10;
    const status = day.status || 'pending';
    
    doc.text(`📍 Location: ${location}`, 20, yPos);
    yPos += 6;
    doc.text(`⏰ Call Time: ${callTime} | Duration: ${hours}h`, 20, yPos);
    yPos += 6;
    doc.text(`📊 Status: ${status}`, 20, yPos);
    
    if (day.notes) {
      yPos += 6;
      doc.text(`Notes: ${day.notes}`, 20, yPos);
    }
    
    // Scenes
    if (day.dayScenes && day.dayScenes.length > 0) {
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Scenes:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      
      day.dayScenes.forEach((ds: any) => {
        const scene = ds.scene;
        const sceneNum = scene?.sceneNumber || '?';
        const heading = scene?.headingRaw || 'Unknown';
        doc.text(`  • Scene ${sceneNum}: ${heading}`, 20, yPos);
        yPos += 5;
      });
    }
    
    yPos += 10;
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generateBudgetPDF(budget: any): Buffer {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CinePilot Budget Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  let yPos = 45;
  
  // Summary box
  doc.setFillColor(240, 240, 250);
  doc.rect(15, yPos - 5, 180, 25, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  
  const planned = budget.totalPlanned || budget.planned || 0;
  const actual = budget.totalActual || budget.actual || 0;
  const variance = budget.variance || (planned - actual);
  
  doc.text(`Total Budget: ₹${(planned / 100000).toFixed(1)}L`, 25, yPos + 5);
  doc.text(`Spent: ₹${(actual / 100000).toFixed(1)}L`, 25, yPos + 13);
  doc.text(`Remaining: ₹${(variance / 100000).toFixed(1)}L`, 110, yPos + 5);
  
  const percentSpent = planned > 0 ? ((actual / planned) * 100).toFixed(1) : '0';
  doc.text(`Utilization: ${percentSpent}%`, 110, yPos + 13);
  
  yPos += 40;
  
  // Line items
  if (budget.items && budget.items.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Line Items', 15, yPos);
    yPos += 8;
    
    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(15, yPos - 4, 180, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Category', 17, yPos);
    doc.text('Item', 60, yPos);
    doc.text('Planned', 120, yPos);
    doc.text('Actual', 155, yPos);
    yPos += 8;
    
    // Rows
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    budget.items.forEach((item: any) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(String(item.category || '').substring(0, 20), 17, yPos);
      doc.text(String(item.item || '').substring(0, 25), 60, yPos);
      doc.text(`₹${((item.planned || 0) / 1000).toFixed(0)}K`, 120, yPos);
      doc.text(`₹${((item.actual || 0) / 1000).toFixed(0)}K`, 155, yPos);
      yPos += 6;
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generateCrewPDF(crew: any[]): Buffer {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CinePilot Crew List', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Crew: ${crew.length} | Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(15, yPos - 4, 180, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Name', 17, yPos);
  doc.text('Role', 60, yPos);
  doc.text('Department', 110, yPos);
  doc.text('Contact', 150, yPos);
  yPos += 8;
  
  // Rows
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  
  crew.forEach((member: any) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(String(member.name || '').substring(0, 20), 17, yPos);
    doc.text(String(member.role || '').substring(0, 22), 60, yPos);
    doc.text(String(member.department || '').substring(0, 18), 110, yPos);
    doc.text(String(member.phone || '').substring(0, 15), 150, yPos);
    yPos += 6;
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generateShotListPDF(shots: any[]): Buffer {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CinePilot Shot List', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Shots: ${shots.length} | Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(15, yPos - 4, 180, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Scene', 17, yPos);
  doc.text('Shot', 35, yPos);
  doc.text('Description', 55, yPos);
  doc.text('Size', 120, yPos);
  doc.text('Movement', 145, yPos);
  doc.text('Duration', 175, yPos);
  yPos += 8;
  
  // Rows
  doc.setTextColor(60, 60, 60);
  
  shots.forEach((shot: any) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(String(shot.sceneNumber || ''), 17, yPos);
    doc.text(String(shot.shotIndex || ''), 35, yPos);
    doc.text(String(shot.shotText || '').substring(0, 30), 55, yPos);
    doc.text(String(shot.shotSize || ''), 120, yPos);
    doc.text(String(shot.cameraMovement || '').substring(0, 12), 145, yPos);
    doc.text(`${shot.durationEstSec || 0}s`, 175, yPos);
    yPos += 5;
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generateLocationsPDF(locations: any[]): Buffer {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CinePilot Location List', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Locations: ${locations.length} | Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  locations.forEach((loc: any) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Location card
    doc.setFillColor(245, 245, 250);
    doc.rect(15, yPos - 4, 180, 22, 'F');
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(String(loc.name || 'Unknown'), 20, yPos + 3);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(String(loc.address || '').substring(0, 50), 20, yPos + 10);
    doc.text(`Type: ${loc.type || 'N/A'} | Capacity: ${loc.capacity || 'N/A'}`, 20, yPos + 16);
    
    yPos += 28;
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

// Demo fallback data when database is unavailable
const DEMO_EXPORT_TYPES = [
  { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅' },
  { id: 'callsheet', name: 'Call Sheet', format: 'PDF', icon: '📋' },
  { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰' },
  { id: 'shot_list', name: 'Shot List', format: 'CSV', icon: '🎬' },
  { id: 'crew', name: 'Crew List', format: 'CSV', icon: '👥' },
  { id: 'equipment', name: 'Equipment', format: 'CSV', icon: '🎥' },
  { id: 'full_json', name: 'Full Project JSON', format: 'JSON', icon: '📦' },
  { id: 'locations', name: 'Locations', format: 'JSON', icon: '📍' },
];

const DEMO_SCHEDULE = [
  { dayNumber: 1, date: '2026-03-15', location: 'Studio A', scenes: ['Scene 1', 'Scene 2', 'Scene 3'], callTime: '06:00', estimatedHours: 10, notes: 'Hero introduction' },
  { dayNumber: 2, date: '2026-03-16', location: 'Temple Road', scenes: ['Scene 4', 'Scene 5'], callTime: '05:30', estimatedHours: 12, notes: 'Outdoor shoot - temple festival' },
  { dayNumber: 3, date: '2026-03-17', location: 'Office Building', scenes: ['Scene 6', 'Scene 7', 'Scene 8'], callTime: '07:00', estimatedHours: 8, notes: 'Day interior - corporate meeting' },
  { dayNumber: 4, date: '2026-03-18', location: 'Marina Beach', scenes: ['Scene 9', 'Scene 10'], callTime: '04:30', estimatedHours: 10, notes: 'Sunrise shoot - romantic sequence' },
  { dayNumber: 5, date: '2026-03-19', location: 'Village House', scenes: ['Scene 11', 'Scene 12', 'Scene 13'], callTime: '06:00', estimatedHours: 12, notes: 'Family drama sequences' },
];

const DEMO_BUDGET = {
  items: [
    { category: 'Production', item: 'Camera Equipment', planned: 500000, actual: 480000 },
    { category: 'Production', item: 'Lighting', planned: 200000, actual: 210000 },
    { category: 'Post', item: 'Editing', planned: 300000, actual: 280000 },
    { category: 'Post', item: 'VFX', planned: 800000, actual: 750000 },
  ],
  totalPlanned: 1800000,
  totalActual: 1720000,
  variance: 80000,
};

const DEMO_CREW = [
  { name: 'Ravi Kumar', role: 'Director of Photography', department: 'Camera', phone: '+91 98765 43210', email: 'ravi@film.com', dailyRate: 75000 },
  { name: 'Anand Venkatesh', role: 'Gaffer', department: 'Lighting', phone: '+91 98765 43211', email: 'anand@film.com', dailyRate: 15000 },
  { name: 'Vijay Raghavan', role: 'Sound Mixer', department: 'Sound', phone: '+91 98765 43212', email: 'vijay@film.com', dailyRate: 12000 },
  { name: 'Madhan Kumar', role: 'Production Designer', department: 'Art', phone: '+91 98765 43213', email: 'madhan@film.com', dailyRate: 45000 },
  { name: 'Lakshmi Devi', role: 'Chief Makeup Artist', department: 'Makeup', phone: '+91 98765 43214', email: 'lakshmi@film.com', dailyRate: 25000 },
  { name: 'Kamal Haasan', role: 'Director', department: 'Direction', phone: '+91 98765 43216', email: 'kamal@film.com', dailyRate: 150000 },
];

const DEMO_SHOTS = [
  { sceneNumber: '1', shotIndex: 1, shotText: 'Hero enters the frame', shotSize: 'WS', cameraAngle: 'eye', cameraMovement: 'static', characters: ['Arjun'], durationEstSec: 8 },
  { sceneNumber: '1', shotIndex: 2, shotText: 'Close-up reaction', shotSize: 'CU', cameraAngle: 'eye', cameraMovement: 'dolly', characters: ['Arjun'], durationEstSec: 5 },
  { sceneNumber: '1', shotIndex: 3, shotText: 'Two-shot dialogue', shotSize: 'MS', cameraAngle: 'eye', cameraMovement: 'pan', characters: ['Arjun', 'Priya'], durationEstSec: 12 },
  { sceneNumber: '2', shotIndex: 1, shotText: 'Wide establishing', shotSize: 'EWS', cameraAngle: 'high', cameraMovement: 'crane', characters: [], durationEstSec: 10 },
  { sceneNumber: '2', shotIndex: 2, shotText: 'Medium shot conversation', shotSize: 'MS', cameraAngle: 'eye', cameraMovement: 'steadicam', characters: ['Mahendra', 'Sathya'], durationEstSec: 15 },
];

const DEMO_LOCATIONS = [
  { id: 'loc-1', name: 'Studio A', address: 'Anna Nagar, Chennai', type: 'studio', capacity: 200, contact: '+91 44 1234 5678', notes: 'Fully equipped sound stage' },
  { id: 'loc-2', name: 'Marina Beach', address: 'Marina Beach Road, Chennai', type: 'exterior', capacity: 500, contact: '+91 44 2345 6789', permits: 'Beach shooting permit required', notes: 'Sunrise and sunset shoots ideal' },
  { id: 'loc-3', name: 'Heritage Villa', address: 'Teynampet, Chennai', type: 'residential', capacity: 50, owner: 'Tamil Nadu Film Society', notes: 'Traditional Tamil architecture' },
];

async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultProject(): Promise<string> {
  let user = await prisma.user.findFirst({ where: { id: 'default-user' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'default-user',
        email: 'dev@cinepilot.ai',
        passwordHash: 'none',
        name: 'Dev User',
      },
    });
  }
  let project = await prisma.project.findUnique({ where: { id: DEFAULT_PROJECT_ID } });
  if (!project) {
    project = await prisma.project.create({
      data: { id: DEFAULT_PROJECT_ID, name: 'Default Project', userId: user.id },
    });
  }
  return project.id;
}

// GET /api/exports - List available export types and recent exports
export async function GET(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // Return demo data with isDemoMode flag
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'json';
    const shootingDays = DEMO_SCHEDULE;

    // Handle PDF format in demo mode
    if (format === 'pdf' && type) {
      let pdfBuffer: Buffer;
      let filename = 'export.pdf';

      switch (type) {
        case 'schedule':
          pdfBuffer = generateSchedulePDF(shootingDays);
          filename = 'schedule.pdf';
          break;
        case 'budget':
          pdfBuffer = generateBudgetPDF(DEMO_BUDGET);
          filename = 'budget.pdf';
          break;
        case 'crew':
          pdfBuffer = generateCrewPDF(DEMO_CREW);
          filename = 'crew.pdf';
          break;
        case 'shot_list':
          pdfBuffer = generateShotListPDF(DEMO_SHOTS);
          filename = 'shot_list.pdf';
          break;
        case 'locations':
          pdfBuffer = generateLocationsPDF(DEMO_LOCATIONS);
          filename = 'locations.pdf';
          break;
        default:
          return NextResponse.json({ error: 'PDF not available for this type' }, { status: 400 });
      }

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
    
    if (type) {
      let data: Record<string, unknown> = {};
      let filename = '';
      
      switch (type) {
        case 'schedule':
          data = { shootingDays: DEMO_SCHEDULE };
          filename = 'schedule.json';
          break;
        case 'budget':
          data = DEMO_BUDGET;
          filename = 'budget.json';
          break;
        case 'crew':
          data = { crew: DEMO_CREW, totalCrew: DEMO_CREW.length, message: 'Demo crew data' };
          filename = 'crew.json';
          break;
        case 'shot_list':
          data = { shots: DEMO_SHOTS, totalShots: DEMO_SHOTS.length, message: 'Demo shot data' };
          filename = 'shot_list.json';
          break;
        case 'locations':
          data = { locations: DEMO_LOCATIONS, totalLocations: DEMO_LOCATIONS.length, message: 'Demo location data' };
          filename = 'locations.json';
          break;
        case 'full_json':
          data = { project: null, message: 'No project data in demo mode' };
          filename = 'full_project.json';
          break;
        default:
          data = { message: 'Demo export not available for this type' };
          filename = 'demo.json';
      }
      
      return NextResponse.json({ ...data, isDemoMode: true });
    }
    
    return NextResponse.json({ exportTypes: DEMO_EXPORT_TYPES, isDemoMode: true });
  }
  
  try {
    const projectId = await ensureDefaultProject();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'json';

    // Base export types
    const exportTypes = [
      { id: 'schedule', name: 'Shooting Schedule', format: 'PDF', icon: '📅' },
      { id: 'callsheet', name: 'Call Sheet', format: 'PDF', icon: '📋' },
      { id: 'budget', name: 'Budget Report', format: 'PDF', icon: '💰' },
      { id: 'shot_list', name: 'Shot List', format: 'CSV', icon: '🎬' },
      { id: 'crew', name: 'Crew List', format: 'CSV', icon: '👥' },
      { id: 'equipment', name: 'Equipment', format: 'CSV', icon: '🎥' },
      { id: 'full_json', name: 'Full Project JSON', format: 'JSON', icon: '📦' },
      { id: 'locations', name: 'Locations', format: 'JSON', icon: '📍' },
    ];

    // Handle PDF format requests
    if (format === 'pdf' && type) {
      let pdfBuffer: Buffer;
      let filename = 'export.pdf';

      switch (type) {
        case 'schedule': {
          const shootingDays = await prisma.shootingDay.findMany({
            where: { projectId },
            include: {
              location: true,
              dayScenes: {
                include: { scene: true },
              },
            },
            orderBy: { dayNumber: 'asc' },
          });
          pdfBuffer = generateSchedulePDF(shootingDays);
          filename = 'schedule.pdf';
          break;
        }
        case 'budget': {
          const items = await prisma.budgetItem.findMany({
            where: { projectId },
            orderBy: { category: 'asc' },
          });
          const totalPlanned = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
          const totalActual = items.reduce((sum, i) => sum + Number(i.actualCost || 0), 0);
          pdfBuffer = generateBudgetPDF({ items, totalPlanned, totalActual, variance: totalPlanned - totalActual });
          filename = 'budget.pdf';
          break;
        }
        case 'crew': {
          const crew = await prisma.crew.findMany({
            where: { projectId },
            orderBy: { department: 'asc' },
          });
          pdfBuffer = generateCrewPDF(crew);
          filename = 'crew.pdf';
          break;
        }
        case 'shot_list': {
          const scripts = await prisma.script.findMany({
            where: { projectId, isActive: true },
            include: {
              scenes: {
                include: {
                  shots: { orderBy: { shotIndex: 'asc' } },
                },
              },
            },
          });
          const shots: any[] = [];
          scripts.forEach((script) => {
            script.scenes.forEach((scene) => {
              scene.shots.forEach((shot) => {
                shots.push({
                  sceneNumber: scene.sceneNumber,
                  shotIndex: shot.shotIndex,
                  shotText: shot.shotText,
                  shotSize: shot.shotSize,
                  cameraMovement: shot.cameraMovement,
                  durationEstSec: shot.durationEstSec,
                });
              });
            });
          });
          pdfBuffer = generateShotListPDF(shots);
          filename = 'shot_list.pdf';
          break;
        }
        case 'locations': {
          const locations = await prisma.location.findMany({
            where: { projectId },
            orderBy: { name: 'asc' },
          });
          pdfBuffer = generateLocationsPDF(locations);
          filename = 'locations.pdf';
          break;
        }
        default:
          return NextResponse.json({ error: 'PDF not available for this type' }, { status: 400 });
      }

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (type) {
      // Generate specific export
      let data: Record<string, unknown> = {};
      let filename = '';
      let contentType = 'application/json';

      switch (type) {
        case 'schedule': {
          const shootingDays = await prisma.shootingDay.findMany({
            where: { projectId },
            include: {
              location: true,
              dayScenes: {
                include: { scene: { include: { sceneCharacters: { include: { character: true } } } } },
              },
            },
            orderBy: { dayNumber: 'asc' },
          });
          data = { shootingDays };
          filename = 'schedule.json';
          break;
        }
        case 'budget': {
          const items = await prisma.budgetItem.findMany({
            where: { projectId },
            orderBy: { category: 'asc' },
          });
          const totalPlanned = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
          const totalActual = items.reduce((sum, i) => sum + Number(i.actualCost || 0), 0);
          data = { items, totalPlanned, totalActual, variance: totalPlanned - totalActual };
          filename = 'budget.json';
          break;
        }
        case 'shot_list': {
          const scripts = await prisma.script.findMany({
            where: { projectId, isActive: true },
            include: {
              scenes: {
                include: {
                  shots: {
                    orderBy: { shotIndex: 'asc' },
                  },
                },
              },
            },
          });
          const allShots = scripts.flatMap(s => 
            s.scenes.flatMap(scene => 
              scene.shots.map(shot => ({
                sceneNumber: scene.sceneNumber,
                shotIndex: shot.shotIndex,
                shotText: shot.shotText,
                shotSize: shot.shotSize,
                cameraAngle: shot.cameraAngle,
                cameraMovement: shot.cameraMovement,
                characters: shot.characters,
                durationEstSec: shot.durationEstSec,
              }))
            )
          );
          data = { shots: allShots, totalShots: allShots.length };
          filename = 'shot_list.json';
          break;
        }
        case 'crew': {
          const crew = await prisma.crew.findMany({
            where: { projectId },
            orderBy: { department: 'asc' },
          });
          data = { crew };
          filename = 'crew.json';
          break;
        }
        case 'equipment': {
          // Equipment rentals
          const equipment = await prisma.equipmentRental.findMany({
            where: { projectId },
          });
          data = { equipment };
          filename = 'equipment.json';
          break;
        }
        case 'locations': {
          const locations = await prisma.location.findMany({
            where: { projectId },
          });
          // Get candidates count for each location
          const locationIntents = await prisma.locationIntent.findMany({
            where: { scene: { script: { projectId } } },
            include: { candidates: true },
          });
          const locationsWithCandidates = locations.map(loc => ({
            ...loc,
            candidateCount: locationIntents.filter(li => 
              li.candidates.some(c => Number(c.latitude) === Number(loc.latitude) && Number(c.longitude) === Number(loc.longitude))
            ).reduce((sum, li) => sum + li.candidates.length, 0)
          }));
          data = { locations: locationsWithCandidates };
          filename = 'locations.json';
          break;
        }
        case 'full_json': {
          // Full project dump
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
              scripts: { include: { scenes: { include: { shots: true } } } },
              characters: true,
              crew: true,
              locations: true,
              shootingDays: { include: { dayScenes: true } },
              budgetItems: true,
            },
          });
          data = { project };
          filename = 'full_project.json';
          break;
        }
        default:
          return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
      }

      // Return as downloadable JSON
      return NextResponse.json({ ...data, isDemoMode: false }, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': contentType,
        },
      });
    }

    // Return export types list
    return NextResponse.json({ exportTypes, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/exports]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/exports - Generate export (for batch exports)
export async function POST(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // Return demo data
    const body = await req.json().catch(() => ({}));
    const { types } = body;
    
    if (!types || !Array.isArray(types)) {
      return NextResponse.json({ error: 'types array required' }, { status: 400 });
    }
    
    const exports: Record<string, unknown> = {};
    for (const type of types) {
      switch (type) {
        case 'schedule':
          exports.schedule = DEMO_SCHEDULE;
          break;
        case 'budget':
          exports.budget = DEMO_BUDGET;
          break;
        case 'crew':
          exports.crew = { crew: DEMO_CREW, count: DEMO_CREW.length };
          break;
        case 'shot_list':
          exports.shot_list = { shots: DEMO_SHOTS, count: DEMO_SHOTS.length };
          break;
        case 'locations':
          exports.locations = { locations: DEMO_LOCATIONS, count: DEMO_LOCATIONS.length };
          break;
        case 'full_json':
          exports.full_json = { project: 'Demo Project', shootingDays: DEMO_SCHEDULE, crew: DEMO_CREW, shots: DEMO_SHOTS, locations: DEMO_LOCATIONS };
          break;
        default:
          exports[type] = { message: 'Demo data not available' };
      }
    }
    
    return NextResponse.json({ exports, generatedAt: new Date().toISOString(), isDemoMode: true });
  }
  
  try {
    const projectId = await ensureDefaultProject();
    const body = await req.json();
    const { types } = body;

    if (!types || !Array.isArray(types)) {
      return NextResponse.json({ error: 'types array required' }, { status: 400 });
    }

    // Generate multiple exports
    const exports: Record<string, unknown> = {};

    for (const type of types) {
      switch (type) {
        case 'schedule': {
          const shootingDays = await prisma.shootingDay.findMany({
            where: { projectId },
            include: { location: true, dayScenes: { include: { scene: true } } },
            orderBy: { dayNumber: 'asc' },
          });
          exports.schedule = shootingDays;
          break;
        }
        case 'budget': {
          const items = await prisma.budgetItem.findMany({ where: { projectId } });
          exports.budget = { items, count: items.length };
          break;
        }
        case 'shot_list': {
          const scripts = await prisma.script.findMany({
            where: { projectId, isActive: true },
            include: { scenes: { include: { shots: true } } },
          });
          exports.shot_list = { scripts, count: scripts.length };
          break;
        }
        case 'crew': {
          const crew = await prisma.crew.findMany({ where: { projectId } });
          exports.crew = { crew, count: crew.length };
          break;
        }
        case 'equipment': {
          exports.equipment = [];
          break;
        }
        case 'locations': {
          const locations = await prisma.location.findMany({ where: { projectId } });
          exports.locations = { locations, count: locations.length };
          break;
        }
      }
    }

    return NextResponse.json({ exports, generatedAt: new Date().toISOString(), isDemoMode: false });
  } catch (error) {
    console.error('[POST /api/exports]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
