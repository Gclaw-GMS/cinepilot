/**
 * CinePilot Seed Script
 * Populates the database with sample data for testing features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CinePilot database...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      email: 'dev@cinepilot.ai',
      passwordHash: 'demo-hash',
      name: 'Dev User',
      role: 'producer',
    },
  });
  console.log('✓ Created user:', user.name);

  // Create default project
  const project = await prisma.project.upsert({
    where: { id: 'default-project' },
    update: {},
    create: {
      id: 'default-project',
      name: 'Kaadhal Movies',
      description: 'Sample Tamil romantic drama for testing',
      language: 'tamil',
      status: 'planning',
      genre: 'Romance',
      userId: user.id,
    },
  });
  console.log('✓ Created project:', project.name);

  // Create sample script with scenes
  const script = await prisma.script.upsert({
    where: { id: 'sample-script-1' },
    update: {},
    create: {
      id: 'sample-script-1',
      projectId: project.id,
      title: 'Kaadhal Vartham',
      content: `KAADHAL VARTHAM
A Tamil Romantic Drama

FADE IN:

INT. COLLEGE CAMPUS - DAY
A beautiful campus with students walking around. VIJAY (25), a charming photography student, carries his camera.

VIJAY
(thinking)
Every frame tells a story. Today, I'll find mine.

EXT. COLLEGE GARDEN - DAY
Priya sits under a tree, reading a book. She's radiant, lost in her world.

VIJAY approaches, camera ready.

VIJAY
Excuse me! Can I take your photo?

PRIYA
(startled)
What? No!

She walks away. Vijay smiles.

INT. COFFEE SHOP - DAY
Vijay enters, sees Priya again. This time, she notices him.

PRIYA
You're that photographer guy!

VIJAY
And you're the girl who refused to be photographed.

PRIYA
(smiling)
I didn't refuse. I was surprised.

They sit together. Conversation flows.

EXT. BEACH - SUNSET
Vijay and Priya walk along the shore. Beautiful sunset.

PRIYA
I never believed in love at first sight.

VIJAY
And now?

PRIYA
(she looks at him)
I'm starting to.

EXT. TEMPLE - DAY
Traditional wedding. Vibrant colors. Priya in traditional attire. Vijay watches her, amazed.

VIJAY
(whispering)
You're beautiful.

INT. APARTMENT - NIGHT
Vijay looks at photos of Priya on his wall.

VIJAY
(voice over)
Some stories start with a single frame.

FADE OUT.

THE END`,
      language: 'tamil',
      version: 1,
    },
  });
  console.log('✓ Created script:', script.title);

  // Create scenes from the script
  const scenesData = [
    { number: '1', index: 0, heading: 'INT. COLLEGE CAMPUS - DAY', location: 'College Campus', intExt: 'INT', timeOfDay: 'DAY', description: 'Vijay, a charming photography student, carries his camera around campus.' },
    { number: '2', index: 1, heading: 'EXT. COLLEGE GARDEN - DAY', location: 'College Garden', intExt: 'EXT', timeOfDay: 'DAY', description: 'Priya sits under a tree, reading a book.' },
    { number: '3', index: 2, heading: 'INT. COFFEE SHOP - DAY', location: 'Coffee Shop', intExt: 'INT', timeOfDay: 'DAY', description: 'Vijay and Priya have a conversation over coffee.' },
    { number: '4', index: 3, heading: 'EXT. BEACH - SUNSET', location: 'Marina Beach', intExt: 'EXT', timeOfDay: 'SUNSET', description: 'Vijay and Priya walk along the shore at sunset.' },
    { number: '5', index: 4, heading: 'EXT. TEMPLE - DAY', location: 'Kapaleeshwarar Temple', intExt: 'EXT', timeOfDay: 'DAY', description: 'Traditional wedding ceremony.' },
    { number: '6', index: 5, heading: 'INT. APARTMENT - NIGHT', location: 'Vijay\'s Apartment', intExt: 'INT', timeOfDay: 'NIGHT', description: 'Vijay looks at photos of Priya.' },
  ];

  for (const sceneData of scenesData) {
    await prisma.scene.upsert({
      where: { id: `scene-${sceneData.number}` },
      update: {},
      create: {
        id: `scene-${sceneData.number}`,
        scriptId: script.id,
        sceneNumber: sceneData.number,
        sceneIndex: sceneData.index,
        headingRaw: sceneData.heading,
        location: sceneData.location,
        intExt: sceneData.intExt,
        timeOfDay: sceneData.timeOfDay,
        description: sceneData.description,
        confidence: 0.95,
      },
    });
  }
  console.log('✓ Created', scenesData.length, 'scenes');

  // Create characters
  const charactersData = [
    { id: 'char-vijay', name: 'Vijay', role: 'Lead Actor', isMain: true },
    { id: 'char-priya', name: 'Priya', role: 'Lead Actress', isMain: true },
    { id: 'char-raj', name: 'Raj', role: 'Best Friend', isMain: false },
  ];

  for (const charData of charactersData) {
    await prisma.character.upsert({
      where: { id: charData.id },
      update: {},
      create: {
        id: charData.id,
        projectId: project.id,
        name: charData.name,
        roleHint: charData.role,
        isMain: charData.isMain,
      },
    });
  }
  console.log('✓ Created', charactersData.length, 'characters');

  // Create crew members
  const crewData = [
    { name: 'Mani Ratnam', role: 'Director', department: 'Direction', dailyRate: 500000 },
    { name: 'Santosh Sivan', role: 'Cinematographer', department: 'Camera', dailyRate: 150000 },
    { name: 'AR Rahman', role: 'Music Composer', department: 'Sound', dailyRate: 1000000 },
    { name: 'Vetri', role: 'Editor', department: 'Post Production', dailyRate: 75000 },
    { name: 'Lakshmi', role: 'Art Director', department: 'Art', dailyRate: 50000 },
    { name: 'Prakash', role: 'Camera Operator', department: 'Camera', dailyRate: 15000 },
    { name: 'Ravi', role: 'Sound Engineer', department: 'Sound', dailyRate: 12000 },
    { name: 'Kumar', role: 'Gaffer', department: 'Lighting', dailyRate: 8000 },
    { name: 'Divya', role: 'Makeup Artist', department: 'Makeup', dailyRate: 6000 },
    { name: 'Meena', role: 'Costume Designer', department: 'Costume', dailyRate: 10000 },
  ];

  for (const crewMember of crewData) {
    await prisma.crew.create({
      data: {
        projectId: project.id,
        name: crewMember.name,
        role: crewMember.role,
        department: crewMember.department,
        dailyRate: crewMember.dailyRate,
      },
    });
  }
  console.log('✓ Created', crewData.length, 'crew members');

  // Create budget items
  const budgetCategories = ['Pre-Production', 'Production', 'Post-Production', 'Marketing'];
  const budgetItems = [
    { category: 'Pre-Production', description: 'Script Writing', total: 500000, source: 'estimated' },
    { category: 'Pre-Production', description: 'Location Scouting', total: 300000, source: 'estimated' },
    { category: 'Pre-Production', description: 'Casting', total: 200000, source: 'estimated' },
    { category: 'Production', description: 'Camera Equipment', total: 2500000, source: 'estimated' },
    { category: 'Production', description: 'Lighting Gear', total: 1500000, source: 'estimated' },
    { category: 'Production', description: 'Crew Salaries (30 days)', total: 5000000, source: 'estimated' },
    { category: 'Production', description: 'Location Rentals', total: 2000000, source: 'estimated' },
    { category: 'Production', description: 'Catering', total: 1000000, source: 'estimated' },
    { category: 'Post-Production', description: 'Editing', total: 800000, source: 'estimated' },
    { category: 'Post-Production', description: 'VFX', total: 3000000, source: 'estimated' },
    { category: 'Post-Production', description: 'Music Composition', total: 1500000, source: 'estimated' },
    { category: 'Post-Production', description: 'Sound Mixing', total: 500000, source: 'estimated' },
    { category: 'Marketing', description: 'Promotions', total: 2000000, source: 'estimated' },
    { category: 'Marketing', description: 'Poster Design', total: 300000, source: 'estimated' },
  ];

  for (const item of budgetItems) {
    await prisma.budgetItem.create({
      data: {
        projectId: project.id,
        category: item.category,
        description: item.description,
        total: item.total,
        source: item.source,
      },
    });
  }
  console.log('✓ Created', budgetItems.length, 'budget items');

  // Create sample expenses
  const expensesData = [
    { category: 'Pre-Production', description: 'Script writer advance', amount: 150000, vendor: 'Writer Guild', date: new Date('2026-01-15') },
    { category: 'Production', description: 'Camera deposit', amount: 500000, vendor: 'Film City Rentals', date: new Date('2026-02-01') },
    { category: 'Production', description: 'Location advance - Beach', amount: 200000, vendor: 'Beach Authority', date: new Date('2026-02-05') },
    { category: 'Post-Production', description: 'Editing suite booking', amount: 250000, vendor: 'Post Studio', date: new Date('2026-02-20') },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        projectId: project.id,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        vendor: exp.vendor,
        status: 'approved',
        date: exp.date,
      },
    });
  }
  console.log('✓ Created', expensesData.length, 'expenses');

  // Create locations
  const locationsData = [
    { name: 'Marina Beach', placeType: 'beach', latitude: '13.0827', longitude: '80.2707' },
    { name: 'Kapaleeshwarar Temple', placeType: 'temple', latitude: '13.0336', longitude: '80.2619' },
    { name: 'College Campus', placeType: 'institution', latitude: '13.0100', longitude: '80.2200' },
    { name: 'Coffee Day', placeType: 'cafe', latitude: '13.0500', longitude: '80.2500' },
  ];

  for (const loc of locationsData) {
    await prisma.location.create({
      data: {
        projectId: project.id,
        name: loc.name,
        placeType: loc.placeType,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    });
  }
  console.log('✓ Created', locationsData.length, 'locations');

  console.log('✅ Seed complete! CinePilot is ready to use.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
