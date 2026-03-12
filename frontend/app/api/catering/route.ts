import { NextRequest, NextResponse } from 'next/server'

const DEMO_PROJECT_ID = 'demo-project'

// In-memory fallback data
let fallbackPlan: any = null
let fallbackCaterers: any[] = []

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

// GET /api/catering - Get catering plan and caterers
export async function GET(request: NextRequest) {
  initFallbackData()
  
  return NextResponse.json({
    cateringPlan: fallbackPlan,
    plan: fallbackPlan,
    caterers: fallbackCaterers,
    isDemoMode: true
  })
}

// POST /api/catering - Handle catering actions (demo mode)
export async function POST(request: NextRequest) {
  initFallbackData()
  
  try {
    const body = await request.json()
    const { type, data } = body
    
    if (type === 'addShootDay') {
      const newDay = {
        date: data.date,
        totalCrew: data.totalCrew || 50,
        totalCast: data.totalCast || 10,
        meals: []
      }
      fallbackPlan.shootDays.push(newDay)
      return NextResponse.json({ success: true, shootDay: newDay })
    }
    
    if (type === 'addMeal') {
      const targetDay = fallbackPlan.shootDays.find((sd: any) => sd.date === data.date)
      if (!targetDay) {
        return NextResponse.json({ error: 'Shoot day not found' }, { status: 404 })
      }
      const newMeal = {
        id: `m-${Date.now()}`,
        type: data.type,
        menu: data.menu || [],
        dietary: data.dietary || [],
        budget: data.budget || 0,
        actualCost: data.actualCost,
        notes: data.notes
      }
      targetDay.meals.push(newMeal)
      return NextResponse.json({ success: true, meal: newMeal })
    }
    
    if (type === 'updateMeal') {
      for (const day of fallbackPlan.shootDays) {
        const mealIndex = day.meals.findIndex((m: any) => m.id === data.mealId)
        if (mealIndex >= 0) {
          day.meals[mealIndex] = { ...day.meals[mealIndex], ...data.updates }
          return NextResponse.json({ success: true, meal: day.meals[mealIndex] })
        }
      }
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
    }
    
    if (type === 'setCaterer') {
      fallbackPlan.catererId = data.catererId
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ success: true, isDemoMode: true })
  } catch (error) {
    console.error('[POST /api/catering]', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// DELETE /api/catering - Handle deletions (demo mode)
export async function DELETE(request: NextRequest) {
  initFallbackData()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    // Try to find and remove meal
    for (const day of fallbackPlan.shootDays) {
      const mealIndex = day.meals.findIndex((m: any) => m.id === id)
      if (mealIndex >= 0) {
        day.meals.splice(mealIndex, 1)
        return NextResponse.json({ success: true })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/catering]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
