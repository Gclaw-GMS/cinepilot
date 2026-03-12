/**
 * Call Sheets API Test Suite
 * Tests all endpoints for the Call Sheets feature
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/call-sheets/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/call-sheets');
  
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

describe('Call Sheets API', () => {
  describe('GET /api/call-sheets', () => {
    it('returns call sheets data', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('isDemoMode');
    });

    it('returns isDemoMode as boolean', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(typeof data.isDemoMode).toBe('boolean');
    });

    it('returns array of call sheets', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('has demo data with proper structure', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet).toHaveProperty('id');
        expect(sheet).toHaveProperty('projectId');
        expect(sheet).toHaveProperty('title');
        expect(sheet).toHaveProperty('date');
        expect(sheet).toHaveProperty('content');
      }
    });

    it('content has call time', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet.content).toHaveProperty('callTime');
      }
    });

    it('content has location', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet.content).toHaveProperty('location');
      }
    });

    it('content has crew calls', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet.content).toHaveProperty('crewCalls');
      }
    });

    it('crew calls have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0 && data.data[0].content?.crewCalls?.length > 0) {
        const crewCall = data.data[0].content.crewCalls[0];
        expect(crewCall).toHaveProperty('name');
        expect(crewCall).toHaveProperty('role');
        expect(crewCall).toHaveProperty('department');
      }
    });

    it('includes scene numbers in content', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet.content).toHaveProperty('scenes');
      }
    });

    it('includes weather info in content', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet.content).toHaveProperty('weather');
      }
    });

    it('has wrap time in content', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const sheet = data.data[0];
        expect(sheet.content).toHaveProperty('wrapTime');
      }
    });
  });

  describe('POST /api/call-sheets', () => {
    it('creates new call sheet', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          title: 'Test Call Sheet',
          date: '2026-04-01',
          content: {
            callTime: '06:00',
            location: 'Test Location',
            scenes: ['1', '2'],
            crewCalls: []
          }
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect([200, 201]).toContain(res.status);
    });

    it('generates call sheet with shootingDayId', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'generate',
          shootingDayId: 'test-day-1'
        }
      });
      const res = await POST(req);
      
      // Either creates or returns error (depending on demo mode)
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('requires shootingDayId for generate action', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'generate'
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('creates with default date', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          title: 'Default Date Sheet'
        }
      });
      const res = await POST(req);
      
      expect([200, 201]).toContain(res.status);
    });

    it('handles empty content', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          title: 'Empty Content Sheet'
        }
      });
      const res = await POST(req);
      
      expect([200, 201]).toContain(res.status);
    });

    it('handles missing title', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          content: { callTime: '06:00' }
        }
      });
      const res = await POST(req);
      
      expect([200, 201]).toContain(res.status);
    });

    it('handles full content structure', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          title: 'Full Content Sheet',
          date: '2026-04-15',
          content: {
            callTime: '05:30',
            wrapTime: '20:00',
            location: 'Chennai Studios',
            locationAddress: 'Film Nagar, Chennai',
            scenes: ['1A', '1B', '2'],
            weather: 'Indoor',
            crewCalls: [
              { name: 'Director', role: 'Director', department: 'Direction', callTime: '05:30' },
              { name: 'DOP', role: 'Cameraman', department: 'Camera', callTime: '06:00' }
            ]
          },
          notes: 'Important day'
        }
      });
      const res = await POST(req);
      
      expect([200, 201]).toContain(res.status);
    });
  });

  describe('Demo Data Validation', () => {
    it('has multiple call sheets', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.data.length).toBeGreaterThan(1);
    });

    it('call sheets have varied locations', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const locations = new Set(data.data.map((s: any) => s.content?.location));
      expect(locations.size).toBeGreaterThan(1);
    });

    it('has crew calls count', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0) {
        const crewCallsCount = data.data[0].content?.crewCalls?.length || 0;
        expect(crewCallsCount).toBeGreaterThan(0);
      }
    });

    it('has different call times', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const callTimes = new Set(data.data.map((s: any) => s.content?.callTime));
      expect(callTimes.size).toBeGreaterThan(1);
    });

    it('has proper scene format', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.data.length > 0 && data.data[0].content?.scenes?.length > 0) {
        const scene = data.data[0].content.scenes[0];
        expect(typeof scene).toBe('string');
      }
    });

    it('has realistic weather info', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const weatherTypes = new Set(data.data.map((s: any) => s.content?.weather).filter(Boolean));
      expect(weatherTypes.size).toBeGreaterThan(0);
    });

    it('has department distribution in crew', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const departments = new Set();
      for (const sheet of data.data) {
        if (sheet.content?.crewCalls) {
          sheet.content.crewCalls.forEach((crew: any) => {
            if (crew.department) departments.add(crew.department);
          });
        }
      }
      expect(departments.size).toBeGreaterThan(1);
    });

    it('has realistic titles', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.data.forEach((sheet: any) => {
        expect(sheet.title.length).toBeGreaterThan(0);
      });
    });

    it('has Tamil cinema production context', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      // Chennai Film Studios, Film Nagar are common Tamil film locations
      const hasTamilContext = data.data.some((sheet: any) => 
        sheet.content?.location?.includes('Chennai') ||
        sheet.content?.location?.includes('Film') ||
        sheet.content?.locationAddress?.includes('Chennai')
      );
      expect(hasTamilContext).toBe(true);
    });

    it('has multiple departments represented', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const allDepartments: string[] = [];
      for (const sheet of data.data) {
        if (sheet.content?.crewCalls) {
          sheet.content.crewCalls.forEach((crew: any) => {
            if (crew.department) allDepartments.push(crew.department);
          });
        }
      }
      
      const uniqueDepts = new Set(allDepartments);
      expect(uniqueDepts.size).toBeGreaterThanOrEqual(4);
    });
  });
});
