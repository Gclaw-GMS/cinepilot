import { NextRequest, NextResponse } from 'next/server'

// Demo data for travel expenses
const DEMO_EXPENSES = [
  { id: '1', projectId: 'demo-project', category: 'flight', description: 'Flight tickets for Lead Actor - Chennai to Bangalore', amount: 12500, date: '2026-03-10', vendor: 'IndiGo', status: 'reimbursed', personName: 'Vijay Sethupathi', personRole: 'Lead Actor', fromLocation: 'Chennai', toLocation: 'Bangalore' },
  { id: '2', projectId: 'demo-project', category: 'hotel', description: 'Hotel stay for director - 3 nights', amount: 18000, date: '2026-03-10', vendor: 'Taj Coromandel', status: 'approved', notes: 'Suite room for 3 nights' },
  { id: '3', projectId: 'demo-project', category: 'train', description: 'Train tickets for crew', amount: 4500, date: '2026-03-12', vendor: 'Indian Railways', status: 'pending', personName: 'Camera Team', personRole: 'Crew' },
  { id: '4', projectId: 'demo-project', category: 'taxi', description: 'Airport pickup for lead actress', amount: 2500, date: '2026-03-15', vendor: 'Ola', status: 'approved', personName: 'Nayanthara' },
  { id: '5', projectId: 'demo-project', category: 'per_diem', description: 'Daily allowance for lead actor', amount: 10000, date: '2026-03-15', status: 'approved', personName: 'Vijay Sethupathi' },
  { id: '6', projectId: 'demo-project', category: 'bus', description: 'Bus booking for junior artists', amount: 3200, date: '2026-03-16', vendor: 'SETC', status: 'pending' },
  { id: '7', projectId: 'demo-project', category: 'auto', description: 'Auto for location recce', amount: 450, date: '2026-03-18', status: 'reimbursed' },
  { id: '8', projectId: 'demo-project', category: 'stay', description: 'PG for assistant director', amount: 15000, date: '2026-03-10', vendor: 'Zolo Stays', status: 'approved', personName: 'AD Team' },
  { id: '9', projectId: 'demo-project', category: 'daily_allowance', description: 'Daily allowance for costume designer', amount: 7500, date: '2026-03-20', status: 'pending', personName: 'Costume Dept' },
  { id: '10', projectId: 'demo-project', category: 'flight', description: 'Return flight for cinematographer', amount: 9800, date: '2026-03-25', vendor: 'Air India', status: 'pending', personName: 'Cinematographer' }
]

// In-memory store (would be database in production)
let expenses = [...DEMO_EXPENSES]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const action = searchParams.get('action')

  try {
    let result = [...expenses]

    // Filter by projectId
    if (projectId) {
      result = result.filter(e => e.projectId === projectId)
    }

    // Filter by category
    if (category && category !== 'all') {
      result = result.filter(e => e.category === category)
    }

    // Filter by status
    if (status && status !== 'all') {
      result = result.filter(e => e.status === status)
    }

    // Summary action
    if (action === 'summary') {
      const categories = ['flight', 'train', 'bus', 'taxi', 'auto', 'hotel', 'stay', 'per_diem', 'daily_allowance']
      const summary = categories.map(cat => {
        const catExpenses = result.filter(e => e.category === cat)
        return {
          category: cat,
          total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
          count: catExpenses.length,
          pending: catExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
          approved: catExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0)
        }
      })

      const totalSpent = result.reduce((sum, e) => sum + e.amount, 0)
      const pendingAmount = result.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)
      const approvedAmount = result.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0)
      const reimbursedAmount = result.filter(e => e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0)

      return NextResponse.json({
        summary,
        totals: {
          totalSpent,
          pendingAmount,
          approvedAmount,
          reimbursedAmount,
          totalExpenses: result.length
        },
        isDemoMode: true
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching travel expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch travel expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create') {
      const newExpense = {
        id: String(expenses.length + 1),
        projectId: data.projectId || 'demo-project',
        category: data.category || 'flight',
        description: data.description || '',
        amount: Number(data.amount) || 0,
        date: data.date || new Date().toISOString().split('T')[0],
        vendor: data.vendor || '',
        status: data.status || 'pending',
        notes: data.notes || '',
        personName: data.personName || '',
        personRole: data.personRole || '',
        fromLocation: data.fromLocation || '',
        toLocation: data.toLocation || ''
      }

      expenses.push(newExpense)
      return NextResponse.json(newExpense, { status: 201 })
    }

    if (action === 'update') {
      const { id, ...updateData } = data
      const index = expenses.findIndex(e => e.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      }

      expenses[index] = { ...expenses[index], ...updateData }
      return NextResponse.json(expenses[index])
    }

    if (action === 'delete') {
      const { id } = data
      const index = expenses.findIndex(e => e.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      }

      expenses.splice(index, 1)
      return NextResponse.json({ success: true })
    }

    if (action === 'reset') {
      expenses = [...DEMO_EXPENSES]
      return NextResponse.json({ success: true, message: 'Demo data restored' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing travel expenses:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
