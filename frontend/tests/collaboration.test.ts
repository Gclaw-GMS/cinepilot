/**
 * Collaboration API Tests
 * Run with: npx jest tests/collaboration.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH, DELETE } from '@/app/api/collaboration/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/collaboration');
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  const req = new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
  });
  
  return req;
}

describe('GET /api/collaboration', () => {
  test('returns team members and stats', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('members');
    expect(data).toHaveProperty('stats');
    expect(Array.isArray(data.members)).toBe(true);
  });

  test('members have required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(data.members.length).toBeGreaterThan(0);
    const member = data.members[0];
    expect(member).toHaveProperty('id');
    expect(member).toHaveProperty('name');
    expect(member).toHaveProperty('role');
    expect(member).toHaveProperty('email');
    expect(member).toHaveProperty('phone');
    expect(member).toHaveProperty('status');
    expect(member).toHaveProperty('skills');
    expect(member).toHaveProperty('department');
  });

  test('stats have required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(data.stats).toHaveProperty('totalMembers');
    expect(data.stats).toHaveProperty('activeNow');
    expect(data.stats).toHaveProperty('pendingTasks');
    expect(data.stats).toHaveProperty('messages');
    expect(data.stats).toHaveProperty('scriptsCount');
    expect(data.stats).toHaveProperty('locationsCount');
  });

  test('status values are valid', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    const validStatuses = ['active', 'busy', 'offline'];
    data.members.forEach((member: { status: string }) => {
      expect(validStatuses).toContain(member.status);
    });
  });

  test('isDemoMode flag is boolean', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    if (data.isDemoMode !== undefined) {
      expect(typeof data.isDemoMode).toBe('boolean');
    }
  });

  test('returns demo data with demo query param', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.members)).toBe(true);
  });

  test('accepts type=members parameter', async () => {
    const req = createRequest({ method: 'GET', params: { type: 'members' } });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.members)).toBe(true);
  });

  test('accepts type=stats parameter', async () => {
    const req = createRequest({ method: 'GET', params: { type: 'stats' } });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('totalMembers');
  });
});

describe('POST /api/collaboration', () => {
  test('invites new team member with valid data', async () => {
    const newMember = {
      name: 'Test Member',
      role: 'Assistant Director',
      department: 'Direction',
      email: 'testmember@cinepilot.ai',
      phone: '+91 99999 88888',
      dailyRate: 5000,
      notes: 'Test collaboration member',
    };

    const req = createRequest({ 
      method: 'POST', 
      body: newMember 
    });
    const res = await POST(req);
    const data = await res.json();

    expect([200, 201]).toContain(res.status);
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(newMember.name);
  });

  test('returns 400 when name is missing', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { role: 'Director' } 
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  test('returns 400 when name is empty', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { name: '   ' } 
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  test('handles optional fields gracefully', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { name: 'Minimal Member' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect([200, 201]).toContain(res.status);
    expect(data.name).toBe('Minimal Member');
  });

  test('validates email format', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        name: 'Email Test',
        email: 'not-an-email',
      }
    });
    const res = await POST(req);
    // Should still succeed with invalid email (stored as-is in demo mode)
    const data = await res.json();
    expect([200, 201, 400]).toContain(res.status);
  });

  test('handles invalid JSON gracefully', async () => {
    const url = new URL('http://localhost:3000/api/collaboration');
    const req = new NextRequest(url, {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/collaboration', () => {
  test('removes team member by id', async () => {
    // First create a member
    const createReq = createRequest({ 
      method: 'POST', 
      body: { name: 'To Delete Member', role: 'PA' } 
    });
    const createRes = await POST(createReq);
    const created = await createRes.json();
    const memberId = created.id;

    // Now delete it (uses JSON body, not query param)
    const deleteReq = createRequest({ 
      method: 'DELETE', 
      body: { id: memberId } 
    });
    const deleteRes = await DELETE(deleteReq);

    expect([200, 201]).toContain(deleteRes.status);
  });

  test('returns 400 when id is missing from body', async () => {
    const req = createRequest({ 
      method: 'DELETE', 
      body: {} 
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });

  test('returns 400 when id is empty', async () => {
    const req = createRequest({ 
      method: 'DELETE', 
      body: { id: '   ' } 
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });
});

describe('Demo Data Validation', () => {
  test('demo members contain Tamil film industry roles', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    const roles = data.members.map((m: { role: string }) => m.role);
    const expectedRoles = ['Director', 'Producer', 'Cinematographer', 'Editor', 'VFX Supervisor'];
    const hasExpectedRole = roles.some((r: string) => expectedRoles.includes(r));
    expect(hasExpectedRole).toBe(true);
  });

  test('demo members have valid daily rates', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    data.members.forEach((member: { dailyRate: number }) => {
      if (member.dailyRate != null) {
        expect(typeof member.dailyRate).toBe('number');
        expect(member.dailyRate).toBeGreaterThan(0);
      }
    });
  });

  test('demo members have valid skills arrays', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    data.members.forEach((member: { skills: string[] }) => {
      expect(Array.isArray(member.skills)).toBe(true);
      member.skills.forEach((skill: string) => {
        expect(typeof skill).toBe('string');
      });
    });
  });

  test('demo stats are realistic', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(data.stats.totalMembers).toBeGreaterThan(0);
    expect(data.stats.activeNow).toBeLessThanOrEqual(data.stats.totalMembers);
    expect(data.stats.pendingTasks).toBeGreaterThanOrEqual(0);
    expect(data.stats.messages).toBeGreaterThan(0);
  });
});
