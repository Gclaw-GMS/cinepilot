import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEMO_PROJECT_ID = 'demo-project'

// In-memory fallback when database is unavailable
let fallbackPlan: any = null
let fallbackCaterers: any[] = []
let isDbAvailable = false

// Initialize fallback data
function initFallbackData() {
  if (fallbackPlan) return
  
  const today = new Date()
  const getDate = (daysOffset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + daysOffset)
    return d.toISOString().split('T')[0]
  }

  fallbackCaterers = [
    { id: 'cat-1', name: 'Anna Curry Point', contactPerson: 'Ramasamy', phone: '+91 98430 12345', email: 'ramasamy@annacurry.com', specialty: 'South Indian & North Indian', rating: 4.5, notes: 'Preferred caterer for Tamil productions' },
    { id: 'cat-2', name: 'Heritage Kitchen', contactPerson: 'Priya', phone: '+91 044 2345 6789', email: 'priya@heritagekitchen.in', specialty: 'Vegetarian South Indian', rating: 4.8, notes: 'Specializes in traditional Tamil meals' },
    { id: 'cat-3', name: 'Star Caterers', contactPerson: 'Kumar', phone: '+91 99401 23456', email: 'kumar@starcaterers.com', specialty: 'Multi-cuisine', rating: 4.2 }
  ]

  fallbackPlan = {
    id: 'plan-1',
    projectId: DEMO_PROJECT_ID,
    catererId: 'cat-1',
    dietaryRestrictions: { 'Vegetarian': 8, 'Non-Vegetarian': 42, 'Vegan': 3, 'Egg': 5, 'No Onion/Garlic': 2, 'Diabetic': 1 },
    totalBudget: 150000,
    totalSpent: 29500,
    shootDays: [
      {
        date: getDate(1),
        totalCrew: 45,
        totalCast: 12,
        meals: [
          { id: 'm1', type: 'breakfast', menu: ['Idli', 'Sambar', 'Vada', 'Pongal', 'Coffee', 'Banana'], dietary: ['Vegetarian', 'Vegan Options'], budget: 3500, actualCost: 3200 },
          { id: 'm2', type: 'lunch', menu: ['Rice', 'Sambar', 'Rasam', 'Chicken 65', 'Fish Fry', 'Poriyal', 'Pappad', 'Pickle', 'Buttermilk', 'Banana Leaf Special'], dietary: ['Non-Vegetarian', 'Vegetarian Options'], budget: 12000, actualCost: 11500 },
          { id: 'm3', type: 'snacks', menu: ['Samosa', 'Bonda', 'Tea', 'Coffee', 'Murukku'], dietary: ['Vegetarian'], budget: 2000, notes: 'Evening pack-up' },
          { id: 'm4', type: 'dinner', menu: ['Biriyani (Chicken)', 'Raitha', 'Pickle', 'Papad', 'Ice Cream', 'Fruits'], dietary: ['Non-Vegetarian'], budget: 15000, actualCost: 14800 }
        ]
      },
      {
        date: getDate(2),
        totalCrew: 45,
        totalCast: 12,
        meals: [
          { id: 'm5', type: 'breakfast', menu: ['Puri', 'Potato Masala', 'Dosa', 'Chutney', 'Coffee'], dietary: ['Vegetarian'], budget: 3500 },
          { id: 'm6', type: 'lunch', menu: ['Rice', 'Dal', 'Vegetable Curry', 'Chicken Curry', 'Fish Curry', 'Salad'], dietary: ['Non-Vegetarian', 'Vegetarian'], budget: 12000 }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// Helper to get or create demo project
async function ensureDemoProject(): Promise<string> {
  try {
    let user = await prisma.user.findFirst({ where: { id: 'default-user' } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'default-user',
          email: 'dev@cinepilot.ai',
          passwordHash: 'demo',
          name: 'Demo User',
        },
      })
    }
    
    let project = await prisma.project.findUnique({ where: { id: DEMO_PROJECT_ID } })
    if (!project) {
      project = await prisma.project.create({
        data: {
          id: DEMO_PROJECT_ID,
          name: 'Demo Project',
          userId: user.id,
        },
      })
    }
    
    isDbAvailable = true
    return project.id
  } catch (error) {
    console.error('Error ensuring demo project:', error)
    isDbAvailable = false
    return DEMO_PROJECT_ID
  }
}

// Check if database is available
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

// Helper to seed demo caterers
async function seedDemoCaterers(projectId: string) {
  try {
    const existingCaterers = await prisma.caterer.findMany({ where: { projectId } })
    if (existingCaterers.length === 0) {
      await prisma.caterer.createMany({ data: [
        { id: 'cat-1', projectId, name: 'Anna Curry Point', contactPerson: 'Ramasamy', phone: '+91 98430 12345', email: 'ramasamy@annacurry.com', specialty: 'South Indian & North Indian', rating: 4.5, notes: 'Preferred caterer for Tamil productions', isActive: true },
        { id: 'cat-2', projectId, name: 'Heritage Kitchen', contactPerson: 'Priya', phone: '+91 044 2345 6789', email: 'priya@heritagekitchen.in', specialty: 'Vegetarian South Indian', rating: 4.8, notes: 'Specializes in traditional Tamil meals', isActive: true },
        { id: 'cat-3', projectId, name: 'Star Caterers', contactPerson: 'Kumar', phone: '+91 99401 23456', email: 'kumar@starcaterers.com', specialty: 'Multi-cuisine', rating: 4.2, isActive: true }
      ]})
    }
  } catch (error) {
    console.error('Error seeding caterers:', error)
  }
}

// Helper to build plan object from database
async function buildPlanFromDb(plan: any) {
  if (!plan) return null
  
  const shootDays = await prisma.cateringShootDay.findMany({
    where: { cateringPlanId: plan.id },
    include: {
      meals: true
    },
    orderBy: { date: 'asc' }
  })
  
  return {
    id: plan.id,
    projectId: plan.projectId,
    catererId: plan.catererId,
    dietaryRestrictions: plan.dietaryRestrictions || {},
    totalBudget: Number(plan.totalBudget || 0),
    totalSpent: Number(plan.totalSpent || 0),
    shootDays: shootDays.map(sd => ({
      date: sd.date.toISOString().split('T')[0],
      totalCrew: sd.totalCrew,
      totalCast: sd.totalCast,
      meals: sd.meals.map(m => ({
        id: m.id,
        type: m.mealType,
        menu: m.menuItems || [],
        dietary: m.dietary || [],
        budget: Number(m.budget || 0),
        actualCost: m.actualCost ? Number(m.actualCost) : undefined,
        notes: m.notes
      }))
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString()
  }
}

// GET /api/catering - Get catering plan and caterers
export async function GET(request: NextRequest) {
  initFallbackData()
  
  try {
    const dbConnected = await checkDbConnection()
    if (!dbConnected) {
      // Return fallback data
      return NextResponse.json({
        plan: fallbackPlan,
        caterers: fallbackCaterers,
        isDemoMode: true
      })
    }
    
    const projectId = await ensureDemoProject()
    await seedDemoCaterers(projectId)
    
    const { searchParams } = new URL(request.url)
    const pId = searchParams.get('projectId') || projectId
    
    // Get or create catering plan
    let plan = await prisma.cateringPlan.findFirst({
      where: { projectId: pId }
    })
    
    if (!plan) {
      // Create default plan with demo data
      plan = await prisma.cateringPlan.create({
        data: {
          projectId: pId,
          totalBudget: 150000,
          totalSpent: 29500,
          dietaryRestrictions: {
            'Vegetarian': 8,
            'Non-Vegetarian': 42,
            'Vegan': 3,
            'Egg': 5,
            'No Onion/Garlic': 2,
            'Diabetic': 1
          }
        }
      })
      
      // Add demo shoot days
      const today = new Date()
      const getDate = (daysOffset: number) => {
        const d = new Date(today)
        d.setDate(d.getDate() + daysOffset)
        return d
      }
      
      // Shoot Day 1
      const shootDay1 = await prisma.cateringShootDay.create({
        data: {
          cateringPlanId: plan.id,
          date: getDate(1),
          totalCrew: 45,
          totalCast: 12
        }
      })
      
      await prisma.cateringMeal.createMany({
        data: [
          {
            shootDayId: shootDay1.id,
            mealType: 'breakfast',
            menuItems: ['Idli', 'Sambar', 'Vada', 'Pongal', 'Coffee', 'Banana'],
            dietary: ['Vegetarian', 'Vegan Options'],
            budget: 3500,
            actualCost: 3200
          },
          {
            shootDayId: shootDay1.id,
            mealType: 'lunch',
            menuItems: ['Rice', 'Sambar', 'Rasam', 'Chicken 65', 'Fish Fry', 'Poriyal', 'Pappad', 'Pickle', 'Buttermilk', 'Banana Leaf Special'],
            dietary: ['Non-Vegetarian', 'Vegetarian Options'],
            budget: 12000,
            actualCost: 11500
          },
          {
            shootDayId: shootDay1.id,
            mealType: 'snacks',
            menuItems: ['Samosa', 'Bonda', 'Tea', 'Coffee', 'Murukku'],
            dietary: ['Vegetarian'],
            budget: 2000,
            notes: 'Evening pack-up'
          },
          {
            shootDayId: shootDay1.id,
            mealType: 'dinner',
            menuItems: ['Biriyani (Chicken)', 'Raitha', 'Pickle', 'Papad', 'Ice Cream', 'Fruits'],
            dietary: ['Non-Vegetarian'],
            budget: 15000,
            actualCost: 14800
          }
        ]
      })
      
      // Shoot Day 2
      const shootDay2 = await prisma.cateringShootDay.create({
        data: {
          cateringPlanId: plan.id,
          date: getDate(2),
          totalCrew: 45,
          totalCast: 12
        }
      })
      
      await prisma.cateringMeal.createMany({
        data: [
          {
            shootDayId: shootDay2.id,
            mealType: 'breakfast',
            menuItems: ['Puri', 'Potato Masala', 'Dosa', 'Chutney', 'Coffee'],
            dietary: ['Vegetarian'],
            budget: 3500
          },
          {
            shootDayId: shootDay2.id,
            mealType: 'lunch',
            menuItems: ['Rice', 'Dal', 'Vegetable Curry', 'Chicken Curry', 'Fish Curry', 'Salad'],
            dietary: ['Non-Vegetarian', 'Vegetarian'],
            budget: 12000
          }
        ]
      })
    }
    
    // Get caterers
    const caterers = await prisma.caterer.findMany({
      where: { projectId: pId, isActive: true },
      orderBy: { rating: 'desc' }
    })
    
    const planData = await buildPlanFromDb(plan)
    
    return NextResponse.json({
      plan: planData,
      caterers: caterers.map(c => ({
        id: c.id,
        name: c.name,
        contactPerson: c.contactPerson,
        phone: c.phone,
        email: c.email,
        specialty: c.specialty,
        rating: c.rating ? Number(c.rating) : 0,
        notes: c.notes
      }))
    })
  } catch (error) {
    console.error('[GET /api/catering]', error)
    // Return fallback data on error
    return NextResponse.json({
      plan: fallbackPlan,
      caterers: fallbackCaterers,
      isDemoMode: true
    })
  }
}

// POST /api/catering - Create/update catering data
export async function POST(request: NextRequest) {
  initFallbackData()
  
  try {
    const dbConnected = await checkDbConnection()
    if (!dbConnected) {
      // Handle fallback mode - just return success without actually saving
      return NextResponse.json({ 
        success: true, 
        isDemoMode: true,
        message: 'Demo mode - changes not persisted' 
      })
    }
    
    const projectId = await ensureDemoProject()
    const body = await request.json()
    const { type, data, projectId: pId } = body
    const targetProjectId = pId || projectId
    
    // Get or create plan
    let plan = await prisma.cateringPlan.findFirst({
      where: { projectId: targetProjectId }
    })
    
    if (!plan) {
      plan = await prisma.cateringPlan.create({
        data: {
          projectId: targetProjectId,
          totalBudget: 0,
          totalSpent: 0
        }
      })
    }
    
    if (type === 'addShootDay') {
      const newShootDay = await prisma.cateringShootDay.create({
        data: {
          cateringPlanId: plan.id,
          date: new Date(data.date),
          totalCrew: data.totalCrew || 0,
          totalCast: data.totalCast || 0
        },
        include: { meals: true }
      })
      
      return NextResponse.json({ 
        success: true, 
        shootDay: {
          date: newShootDay.date.toISOString().split('T')[0],
          totalCrew: newShootDay.totalCrew,
          totalCast: newShootDay.totalCast,
          meals: []
        }
      })
    }
    
    if (type === 'addMeal') {
      // Find shoot day by date
      const shootDays = await prisma.cateringShootDay.findMany({
        where: { cateringPlanId: plan.id }
      })
      
      const targetShootDay = shootDays.find(sd => 
        sd.date.toISOString().split('T')[0] === data.date
      )
      
      if (!targetShootDay) {
        return NextResponse.json({ error: 'Shoot day not found' }, { status: 404 })
      }
      
      const newMeal = await prisma.cateringMeal.create({
        data: {
          shootDayId: targetShootDay.id,
          mealType: data.type,
          menuItems: data.menu || [],
          dietary: data.dietary || [],
          budget: data.budget || 0,
          notes: data.notes
        }
      })
      
      return NextResponse.json({
        success: true,
        meal: {
          id: newMeal.id,
          type: newMeal.mealType,
          menu: newMeal.menuItems || [],
          dietary: newMeal.dietary || [],
          budget: Number(newMeal.budget || 0),
          notes: newMeal.notes
        }
      })
    }
    
    if (type === 'updateMeal') {
      const updated = await prisma.cateringMeal.update({
        where: { id: data.mealId },
        data: {
          menuItems: data.updates.menu,
          dietary: data.updates.dietary,
          budget: data.updates.budget,
          actualCost: data.updates.actualCost,
          notes: data.updates.notes
        }
      })
      
      return NextResponse.json({
        success: true,
        meal: {
          id: updated.id,
          type: updated.mealType,
          menu: updated.menuItems || [],
          dietary: updated.dietary || [],
          budget: Number(updated.budget || 0),
          actualCost: updated.actualCost ? Number(updated.actualCost) : undefined,
          notes: updated.notes
        }
      })
    }
    
    if (type === 'deleteMeal') {
      await prisma.cateringMeal.delete({
        where: { id: data.mealId }
      })
      return NextResponse.json({ success: true })
    }
    
    if (type === 'setCaterer') {
      await prisma.cateringPlan.update({
        where: { id: plan.id },
        data: { catererId: data.catererId }
      })
      return NextResponse.json({ success: true })
    }
    
    if (type === 'updateDietary') {
      await prisma.cateringPlan.update({
        where: { id: plan.id },
        data: { dietaryRestrictions: data.dietaryRestrictions }
      })
      return NextResponse.json({ success: true })
    }
    
    if (type === 'updateBudget') {
      await prisma.cateringPlan.update({
        where: { id: plan.id },
        data: { 
          totalBudget: data.totalBudget,
          totalSpent: data.totalSpent
        }
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/catering]', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// DELETE /api/catering - Delete catering items
export async function DELETE(request: NextRequest) {
  initFallbackData()
  
  try {
    const dbConnected = await checkDbConnection()
    if (!dbConnected) {
      // Handle fallback mode - just return success
      return NextResponse.json({ 
        success: true, 
        isDemoMode: true,
        message: 'Demo mode - changes not persisted' 
      })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    if (type === 'meal') {
      await prisma.cateringMeal.delete({
        where: { id }
      })
      return NextResponse.json({ success: true })
    }
    
    if (type === 'shootDay') {
      await prisma.cateringShootDay.delete({
        where: { id }
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (error) {
    console.error('[DELETE /api/catering]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
