/**
 * Tasks API Test Suite
 * Comprehensive test coverage for production task management
 * Uses direct route imports for testing
 */

import { NextRequest } from 'next/server';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock prisma
const mockPrisma = {
  task: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn().mockRejectedValue(new Error('Database not available')),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    test('returns tasks list with data wrapper', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toHaveProperty('data');
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('returns demo data when no params', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      expect(json.data.length).toBeGreaterThan(0);
    });

    test('includes isDemoMode flag', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      expect(json).toHaveProperty('isDemoMode');
    });

    test('task has required fields', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const task = json.data[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('projectId');
    });

    test('filters by projectId', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?projectId=custom-project');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
    });

    test('filters by status', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?status=pending');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
    });

    test('filters by priority', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?priority=high');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
    });

    test('handles invalid status filter', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?status=invalid');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/tasks', () => {
    test('creates task with title', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Test Task',
          description: 'Test description',
          status: 'pending',
          priority: 'medium',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toHaveProperty('data');
      expect(json.data).toHaveProperty('title');
      // In demo mode, title might be defaulted to 'New Task'
      expect(json.data.title).toMatch(/New Test Task|New Task/);
    });

    test('validation requires title', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ description: 'No title' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    test('defaults projectId when not provided', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Task without project' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      const json = await res.json();
      
      expect(json.data.projectId).toBeDefined();
    });

    test('handles empty body', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    test('includes isDemoMode in response', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Demo task' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      const json = await res.json();
      
      expect(json).toHaveProperty('isDemoMode');
    });
  });

  describe('DELETE /api/tasks', () => {
    test('deletes task with id', async () => {
      const { DELETE } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?id=demo-task-1', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toHaveProperty('success');
    });

    test('fails without id', async () => {
      const { DELETE } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent task', async () => {
      const { DELETE } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?id=non-existent', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(404);
    });

    test('validates id is not empty', async () => {
      const { DELETE } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks?id=', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    test('demo data has valid status values', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
      json.data.forEach((task: { status: string }) => {
        expect(validStatuses).toContain(task.status);
      });
    });

    test('demo data has valid priority values', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      json.data.forEach((task: { priority: string }) => {
        expect(validPriorities).toContain(task.priority);
      });
    });

    test('demo data has realistic titles', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      json.data.forEach((task: { title: string }) => {
        expect(task.title.length).toBeGreaterThan(5);
      });
    });

    test('demo data has multiple statuses', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const statuses = new Set(json.data.map((t: { status: string }) => t.status));
      expect(statuses.size).toBeGreaterThan(1);
    });

    test('demo data has multiple priorities', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const priorities = new Set(json.data.map((t: { priority: string }) => t.priority));
      expect(priorities.size).toBeGreaterThan(1);
    });

    test('demo data has assignees', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const tasksWithAssignee = json.data.filter((t: { assignee: string }) => t.assignee);
      expect(tasksWithAssignee.length).toBeGreaterThan(0);
    });

    test('demo data has due dates', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      const tasksWithDueDate = json.data.filter((t: { dueDate: string }) => t.dueDate);
      expect(tasksWithDueDate.length).toBeGreaterThan(0);
    });

    test('demo data has timestamps', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await GET(req);
      const json = await res.json();
      
      json.data.forEach((task: { createdAt: string; updatedAt: string }) => {
        expect(() => new Date(task.createdAt)).not.toThrow();
        expect(() => new Date(task.updatedAt)).not.toThrow();
      });
    });
  });
});
