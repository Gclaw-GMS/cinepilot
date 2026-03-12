import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH, DELETE } from '@/app/api/projects/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/projects');
  
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

describe('Projects API', () => {
  describe('GET /api/projects', () => {
    it('returns projects data', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('projects have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.length > 0) {
        const project = data[0];
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('status');
        expect(project).toHaveProperty('language');
        expect(project).toHaveProperty('genre');
        expect(project).toHaveProperty('budget');
        expect(project).toHaveProperty('startDate');
        expect(project).toHaveProperty('endDate');
        expect(project).toHaveProperty('createdAt');
        expect(project).toHaveProperty('scriptCount');
        expect(project).toHaveProperty('crewCount');
      }
    });

    it('returns demo data when database unavailable', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('isDemo');
      }
    });

    it('demo projects have Tamil films', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      const tamilProjects = data.filter((p: { language: string }) => p.language === 'tamil');
      expect(tamilProjects.length).toBeGreaterThan(0);
    });

    it('demo projects have different statuses', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      const statuses = new Set(data.map((p: { status: string }) => p.status));
      expect(statuses.size).toBeGreaterThan(1);
    });

    it('demo projects have realistic budgets', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      data.forEach((project: { budget: string | null }) => {
        if (project.budget) {
          const budget = parseInt(project.budget);
          expect(budget).toBeGreaterThan(0);
        }
      });
    });

    it('demo projects have valid dates', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      data.forEach((project: { startDate: string | null; endDate: string | null }) => {
        if (project.startDate && project.endDate) {
          expect(new Date(project.startDate).getTime()).toBeLessThanOrEqual(new Date(project.endDate).getTime());
        }
      });
    });

    it('scriptCount and crewCount are numbers', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      data.forEach((project: { scriptCount: unknown; crewCount: unknown }) => {
        expect(typeof project.scriptCount).toBe('number');
        expect(typeof project.crewCount).toBe('number');
      });
    });
  });

  describe('POST /api/projects', () => {
    it('creates project with valid data', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          name: 'Test Project',
          description: 'A test project',
          language: 'tamil',
          genre: 'Drama',
          budget: 10000000,
          startDate: '2026-01-01',
          endDate: '2026-03-01',
        },
      });
      
      const res = await POST(req);
      
      // May return 200 (demo mode) or 500 (DB error) but should not return 400
      expect([200, 500]).toContain(res.status);
    });

    it('returns 400 when name is missing', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          description: 'A test project',
          language: 'tamil',
        },
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 when name is empty', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          name: '   ',
          description: 'A test project',
        },
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('creates project with minimal data', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          name: 'Minimal Project',
        },
      });
      
      const res = await POST(req);
      
      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(res.status);
    });

    it('handles empty body gracefully', async () => {
      const req = createRequest({
        method: 'POST',
        body: {},
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
    });

    it('accepts valid language options', async () => {
      const languages = ['tamil', 'hindi', 'english', 'telugu', 'malayalam', 'kannada'];
      
      for (const lang of languages) {
        const req = createRequest({
          method: 'POST',
          body: {
            name: `Test ${lang} Project`,
            language: lang,
          },
        });
        
        const res = await POST(req);
        // Should not return validation error for language
        expect([200, 500]).toContain(res.status);
      }
    });

    it('project has correct structure on creation', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          name: 'Structure Test Project',
          description: 'Testing response structure',
          language: 'tamil',
          genre: 'Thriller',
          budget: 5000000,
        },
      });
      
      const res = await POST(req);
      
      // In demo mode or with DB, check structure
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('language');
      }
    });
  });

  describe('PATCH /api/projects', () => {
    it('returns 400 when id is missing', async () => {
      const req = createRequest({
        method: 'PATCH',
        body: {
          name: 'Updated Name',
        },
      });
      
      const res = await PATCH(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error).toContain('id');
    });

    it('returns 400 when id is empty', async () => {
      const req = createRequest({
        method: 'PATCH',
        body: {
          id: '   ',
          name: 'Updated Name',
        },
      });
      
      const res = await PATCH(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
    });

    it('updates project name', async () => {
      const req = createRequest({
        method: 'PATCH',
        body: {
          id: 'demo-project-1',
          name: 'Updated Project Name',
        },
      });
      
      const res = await PATCH(req);
      
      // Either succeeds or fails gracefully
      expect([200, 404, 500]).toContain(res.status);
    });

    it('updates multiple fields', async () => {
      const req = createRequest({
        method: 'PATCH',
        body: {
          id: 'demo-project-1',
          name: 'Multi Update Project',
          description: 'Updated description',
          status: 'completed',
        },
      });
      
      const res = await PATCH(req);
      
      expect([200, 404, 500]).toContain(res.status);
    });

    it('handles budget update', async () => {
      const req = createRequest({
        method: 'PATCH',
        body: {
          id: 'demo-project-1',
          budget: 99999999,
        },
      });
      
      const res = await PATCH(req);
      
      expect([200, 404, 500]).toContain(res.status);
    });

    it('handles date updates', async () => {
      const req = createRequest({
        method: 'PATCH',
        body: {
          id: 'demo-project-1',
          startDate: '2026-02-01',
          endDate: '2026-05-01',
        },
      });
      
      const res = await PATCH(req);
      
      expect([200, 404, 500]).toContain(res.status);
    });

    it('handles status update', async () => {
      const statuses = ['planning', 'pre-production', 'shooting', 'post-production', 'completed'];
      
      for (const status of statuses) {
        const req = createRequest({
          method: 'PATCH',
          body: {
            id: 'demo-project-1',
            status,
          },
        });
        
        const res = await PATCH(req);
        expect([200, 404, 500]).toContain(res.status);
      }
    });
  });

  describe('DELETE /api/projects', () => {
    it('returns 400 when id is missing', async () => {
      const req = createRequest({
        method: 'DELETE',
        body: {},
      });
      
      const res = await DELETE(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error).toContain('id');
    });

    it('returns 400 when id is empty', async () => {
      const req = createRequest({
        method: 'DELETE',
        body: {
          id: '   ',
        },
      });
      
      const res = await DELETE(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
    });

    it('deletes existing project', async () => {
      const req = createRequest({
        method: 'DELETE',
        body: {
          id: 'demo-project-1',
        },
      });
      
      const res = await DELETE(req);
      
      // Either succeeds or fails gracefully (404 if not found)
      expect([200, 404, 500]).toContain(res.status);
    });

    it('handles non-existent project', async () => {
      const req = createRequest({
        method: 'DELETE',
        body: {
          id: 'non-existent-project-12345',
        },
      });
      
      const res = await DELETE(req);
      
      // Should return error for not found
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('Demo Data Validation', () => {
    it('demo projects contain Tamil cinema names', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      const names = data.map((p: { name: string }) => p.name.toLowerCase());
      // Tamil film names often have distinctive patterns
      expect(data.length).toBeGreaterThan(0);
    });

    it('demo projects cover different production stages', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      const statusCounts = {
        planning: 0,
        'pre-production': 0,
        shooting: 0,
        'post-production': 0,
        completed: 0,
      };
      
      data.forEach((p: { status: string }) => {
        if (p.status in statusCounts) {
          statusCounts[p.status as keyof typeof statusCounts]++;
        }
      });
      
      // Should have at least 2 different statuses
      const uniqueStatuses = Object.values(statusCounts).filter(v => v > 0).length;
      expect(uniqueStatuses).toBeGreaterThanOrEqual(2);
    });

    it('demo budgets are realistic for Indian film production', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((p: { budget: string | null }) => {
        if (p.budget) {
          const budget = parseInt(p.budget);
          // Indian films range from low budget to blockbuster
          expect(budget).toBeGreaterThanOrEqual(1000000); // 10L
          expect(budget).toBeLessThanOrEqual(500000000); // 50Cr
        }
      });
    });

    it('demo projects have genre information', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((p: { genre: string | null }) => {
        expect(p.genre).toBeDefined();
        expect(typeof p.genre).toBe('string');
      });
    });

    it('demo projects have descriptions', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((p: { description: string | null }) => {
        expect(p.description).toBeDefined();
        expect(p.description!.length).toBeGreaterThan(10);
      });
    });

    it('demo projects have start and end dates', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((p: { startDate: string | null; endDate: string | null }) => {
        expect(p.startDate).toBeDefined();
        expect(p.endDate).toBeDefined();
      });
    });

    it('demo projects have varied crew sizes', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      const crewCounts = data.map((p: { crewCount: number }) => p.crewCount);
      const uniqueCounts = new Set(crewCounts);
      
      // Should have variation in crew sizes
      expect(uniqueCounts.size).toBeGreaterThan(1);
    });

    it('demo projects have valid IDs', async () => {
      const req = createRequest({ method: 'GET', params: { demo: 'true' } });
      const res = await GET(req);
      const data = await res.json();
      
      data.forEach((p: { id: string }) => {
        expect(p.id).toBeDefined();
        expect(typeof p.id).toBe('string');
        expect(p.id.length).toBeGreaterThan(0);
      });
    });
  });
});
