import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo (would be database in production)
let teamMembers: TeamMember[] = [
  { id: '1', name: 'Rajesh Kumar', role: 'Director', email: 'rajesh@film.com', phone: '+91 98765 43210', status: 'active', skills: ['Narrative', 'Casting'], createdAt: new Date().toISOString() },
  { id: '2', name: 'Priya Sharma', role: 'Producer', email: 'priya@film.com', phone: '+91 98765 43211', status: 'busy', skills: ['Budgeting', 'Scheduling'], createdAt: new Date().toISOString() },
  { id: '3', name: 'Arun Vijay', role: 'Cinematographer', email: 'arun@film.com', phone: '+91 98765 43212', status: 'active', skills: ['Camera', 'Lighting'], createdAt: new Date().toISOString() },
  { id: '4', name: 'Meera Kumari', role: 'Production Designer', email: 'meera@film.com', phone: '+91 98765 43213', status: 'active', skills: ['Art Direction', 'Set Design'], createdAt: new Date().toISOString() },
  { id: '5', name: 'Vikram Seth', role: 'Sound Engineer', email: 'vikram@film.com', phone: '+91 98765 43214', status: 'offline', skills: ['Audio', 'Mixing'], createdAt: new Date().toISOString() },
];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'active' | 'busy' | 'offline';
  skills: string[];
  createdAt: string;
}

export async function GET() {
  try {
    return NextResponse.json({ 
      members: teamMembers,
      stats: {
        total: teamMembers.length,
        active: teamMembers.filter(m => m.status === 'active').length,
        busy: teamMembers.filter(m => m.status === 'busy').length,
        offline: teamMembers.filter(m => m.status === 'offline').length,
      }
    });
  } catch (error) {
    console.error('[GET /api/collaboration]', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, email, phone, skills, status } = body;

    if (!name || !role || !email) {
      return NextResponse.json({ error: 'Name, role, and email are required' }, { status: 400 });
    }

    const newMember: TeamMember = {
      id: String(Date.now()),
      name,
      role,
      email,
      phone: phone || '',
      status: status || 'offline',
      skills: skills || [],
      createdAt: new Date().toISOString(),
    };

    teamMembers.push(newMember);
    return NextResponse.json({ member: newMember });
  } catch (error) {
    console.error('[POST /api/collaboration]', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const index = teamMembers.findIndex(m => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    teamMembers[index] = { ...teamMembers[index], ...updates };
    return NextResponse.json({ member: teamMembers[index] });
  } catch (error) {
    console.error('[PATCH /api/collaboration]', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const index = teamMembers.findIndex(m => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    teamMembers.splice(index, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/collaboration]', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
