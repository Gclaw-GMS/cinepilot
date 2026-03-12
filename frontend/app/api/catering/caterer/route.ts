import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo mode
let fallbackCaterers: any[] = [
  { id: 'cat-1', name: 'Anna Curry Point', contactPerson: 'Ramasamy', phone: '+91 98430 12345', email: 'ramasamy@annacurry.com', specialty: 'South Indian & North Indian', rating: 4.5, notes: 'Preferred caterer for Tamil productions' },
  { id: 'cat-2', name: 'Heritage Kitchen', contactPerson: 'Priya', phone: '+91 044 2345 6789', email: 'priya@heritagekitchen.in', specialty: 'Vegetarian South Indian', rating: 4.8, notes: 'Specializes in traditional Tamil meals' },
  { id: 'cat-3', name: 'Star Caterers', contactPerson: 'Kumar', phone: '+91 99401 23456', email: 'kumar@starcaterers.com', specialty: 'Multi-cuisine', rating: 4.2 }
]

// POST /api/catering/caterer - Add a new caterer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, contactPerson, phone, email, specialty, rating } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const newCaterer = {
      id: `cat-${Date.now()}`,
      name,
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      specialty: specialty || null,
      rating: rating || null,
      notes: null
    }

    fallbackCaterers.push(newCaterer)

    return NextResponse.json(newCaterer, { status: 201 })
  } catch (error) {
    console.error('[POST /api/catering/caterer]', error)
    return NextResponse.json({ error: 'Failed to create caterer' }, { status: 500 })
  }
}

// GET /api/catering/caterer - List caterers
export async function GET() {
  return NextResponse.json(fallbackCaterers)
}

// DELETE /api/catering/caterer - Remove a caterer
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  const index = fallbackCaterers.findIndex(c => c.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Caterer not found' }, { status: 404 })
  }
  
  fallbackCaterers.splice(index, 1)
  return NextResponse.json({ success: true })
}
