import { NextResponse } from 'next/server'

// AI API client - connects to backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Script Analysis
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    let endpoint = ''
    switch (action) {
      case 'script-analyze':
        endpoint = '/ai/script-analyze'
        break
      case 'budget-forecast':
        endpoint = '/ai/budget-forecast'
        break
      case 'optimize-schedule':
        endpoint = '/ai/optimize-schedule'
        break
      case 'risk-detect':
        endpoint = '/ai/risk-detect'
        break
      case 'shot-suggest':
        endpoint = '/ai/shot-suggest'
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    
    // Try to call backend
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        return NextResponse.json(result)
      }
    } catch (e) {
      // Backend unavailable, return demo data
    }
    
    // Return demo data if backend unavailable
    return NextResponse.json(getDemoData(action, data))
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoData(action: string, data: any) {
  switch (action) {
    case 'script-analyze':
      return {
        complexity_score: 7.5,
        total_scenes: data.text ? Math.floor(data.text.length / 500) : 45,
        int_scenes: 30,
        ext_scenes: 15,
        locations: ['COLLEGE', 'BEACH', 'HOSTEL', 'CANTEEN', 'HOSPITAL'],
        characters: ['RAGHU', 'JANANI', 'ADHI', 'SHRUTHI', 'DAVID'],
        dialogue_count: 180,
        estimated_pages: 22
      }
    case 'budget-forecast':
      return {
        total_budget: 45000000,
        breakdown: {
          Locations: 12000000,
          Equipment: 8000000,
          Crew: 15000000,
          'Post-Production': 6000000,
          Contingency: 4000000
        },
        risk_factors: ['Monsoon season', 'Multiple locations'],
        potential_savings: 2500000
      }
    case 'risk-detect':
      return {
        risk_score: 5,
        risk_level: 'Medium',
        factors: ['Large cast', 'Extended schedule'],
        mitigations: ['Pre-plan batch shooting']
      }
    default:
      return {}
  }
}
