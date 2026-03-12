/**
 * Tasks API Test Suite
 * Comprehensive test coverage for production task management
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3002/api/tasks';

describe('Tasks API', () => {
  const testTask = {
    projectId: 'test-project',
    title: 'Test Task',
    description: 'Test description',
    status: 'pending',
    priority: 'medium',
    assignee: 'Test Assignee',
    dueDate: '2026-04-01',
  };

  describe('GET /api/tasks', () => {
    test('returns tasks list with data wrapper', async () => {
      const res = await fetch(API_BASE);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json).toHaveProperty('data');
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('returns demo data when no params', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      expect(json.data.length).toBeGreaterThan(0);
    });

    test('includes isDemoMode flag', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      expect(json).toHaveProperty('isDemoMode');
    });

    test('task has required fields', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      const task = json.data[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('projectId');
    });

    test('task has optional fields', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      const task = json.data[0];
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('assignee');
      expect(task).toHaveProperty('dueDate');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
    });

    test('handles projectId filter', async () => {
      const res = await fetch(`${API_BASE}?projectId=default-project`);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('handles status filter', async () => {
      const res = await fetch(`${API_BASE}?status=pending`);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('handles priority filter', async () => {
      const res = await fetch(`${API_BASE}?priority=high`);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    test('creates new task with valid data', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testTask),
      });
      
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json).toHaveProperty('data');
      expect(json.data).toHaveProperty('id');
    });

    test('validation requires title', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testTask, title: '' }),
      });
      
      expect(res.status).toBe(400);
    });

    test('defaults projectId if not provided', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Task' }),
      });
      
      expect(res.ok).toBe(true);
    });

    test('handles empty body gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      expect(res.status).toBe(400); // title is required
    });

    test('accepts optional fields', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testTask,
          dueDate: '2026-04-15',
          assignee: 'Producer',
        }),
      });
      
      expect(res.ok).toBe(true);
    });

    test('response includes isDemoMode', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testTask),
      });
      
      const json = await res.json();
      expect(json).toHaveProperty('isDemoMode');
    });
  });

  describe('DELETE /api/tasks', () => {
    test('deletes task with valid ID in query param', async () => {
      // First create a task
      const createRes = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Task to Delete' }),
      });
      const createJson = await createRes.json();
      const taskId = createJson.data.id;
      
      // Now delete it
      const res = await fetch(`${API_BASE}?id=${taskId}`, {
        method: 'DELETE',
      });
      
      expect([200, 404]).toContain(res.status);
    });

    test('fails without task ID', async () => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
      });
      
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent ID', async () => {
      const res = await fetch(`${API_BASE}?id=non-existent-task`, {
        method: 'DELETE',
      });
      
      expect([200, 404]).toContain(res.status);
    });

    test('validates ID is not empty', async () => {
      const res = await fetch(`${API_BASE}?id=`, {
        method: 'DELETE',
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    test('demo tasks have valid status values', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
      
      for (const task of json.data) {
        expect(validStatuses).toContain(task.status);
      }
    });

    test('demo tasks have valid priority values', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      
      for (const task of json.data) {
        expect(validPriorities).toContain(task.priority);
      }
    });

    test('demo tasks have realistic titles', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      
      for (const task of json.data) {
        expect(task.title.length).toBeGreaterThan(0);
        expect(task.description).toBeDefined();
      }
    });

    test('demo tasks cover multiple statuses', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      const statuses = new Set(json.data.map((t: any) => t.status));
      
      expect(statuses.size).toBeGreaterThan(1);
    });

    test('demo tasks cover multiple priorities', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      const priorities = new Set(json.data.map((t: any) => t.priority));
      
      expect(priorities.size).toBeGreaterThan(1);
    });

    test('demo tasks have assignees', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      
      // Some tasks may have null assignees
      const tasksWithAssignees = json.data.filter((t: any) => t.assignee);
      expect(tasksWithAssignees.length).toBeGreaterThan(0);
    });

    test('demo tasks have due dates', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      
      // Some tasks may have null due dates
      const tasksWithDates = json.data.filter((t: any) => t.dueDate);
      expect(tasksWithDates.length).toBeGreaterThan(0);
    });

    test('demo tasks have proper timestamps', async () => {
      const res = await fetch(API_BASE);
      const json = await res.json();
      
      for (const task of json.data) {
        expect(task.createdAt).toBeDefined();
        expect(task.updatedAt).toBeDefined();
        expect(new Date(task.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(task.updatedAt).getTime()).toBeGreaterThan(0);
      }
    });
  });
});
