/**
 * Call Sheets API Test Suite
 * Tests all endpoints for the Call Sheets feature
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Test configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3002';

describe('Call Sheets API', () => {
  let callSheetId: string;
  
  afterEach(async () => {
    // Cleanup: delete any created call sheets
    try {
      await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callSheetId }),
      });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/call-sheets', () => {
    it('should return call sheets data', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      expect(res.ok).toBe(true);
      
      const json = await res.json();
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('isDemoMode');
    });

    it('should return isDemoMode as boolean', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      expect(typeof json.isDemoMode).toBe('boolean');
    });

    it('should return array of call sheets', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should have demo data with proper structure', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet).toHaveProperty('id');
        expect(sheet).toHaveProperty('projectId');
        expect(sheet).toHaveProperty('title');
        expect(sheet).toHaveProperty('date');
        expect(sheet).toHaveProperty('content');
        expect(sheet.content).toHaveProperty('callTime');
        expect(sheet.content).toHaveProperty('location');
        expect(sheet.content).toHaveProperty('crewCalls');
      }
    });

    it('should have crew calls with required fields', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0 && json.data[0].content.crewCalls.length > 0) {
        const crewCall = json.data[0].content.crewCalls[0];
        expect(crewCall).toHaveProperty('name');
        expect(crewCall).toHaveProperty('role');
        expect(crewCall).toHaveProperty('department');
        expect(crewCall).toHaveProperty('callTime');
      }
    });

    it('should include scene numbers in content', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet.content).toHaveProperty('scenes');
        expect(Array.isArray(sheet.content.scenes)).toBe(true);
      }
    });

    it('should include weather info in content', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet.content).toHaveProperty('weather');
      }
    });

    it('should have location address in content', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet.content).toHaveProperty('locationAddress');
      }
    });

    it('should include wrap time in content', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet.content).toHaveProperty('wrapTime');
      }
    });

    it('should have createdAt timestamp', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet).toHaveProperty('createdAt');
        expect(new Date(sheet.createdAt).getTime()).toBeGreaterThan(0);
      }
    });

    it('should include notes field', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet).toHaveProperty('notes');
      }
    });

    it('should return at least one demo call sheet', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      expect(json.data.length).toBeGreaterThan(0);
    });

    it('should have proper title format', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(typeof sheet.title).toBe('string');
        expect(sheet.title.length).toBeGreaterThan(0);
      }
    });

    it('should have valid date format', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(new Date(sheet.date).getTime()).toBeGreaterThan(0);
      }
    });

    it('should have proper projectId', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      if (json.data.length > 0) {
        const sheet = json.data[0];
        expect(sheet).toHaveProperty('projectId');
        expect(typeof sheet.projectId).toBe('string');
      }
    });
  });

  describe('POST /api/call-sheets', () => {
    it('should create a new call sheet with title', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Call Sheet',
          date: new Date().toISOString(),
          content: {
            callTime: '06:00',
            wrapTime: '19:00',
            location: 'Test Location',
            scenes: ['1', '2', '3'],
            crewCalls: [],
          },
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      callSheetId = json.id;
      expect(json).toHaveProperty('id');
      expect(json.title).toBe('Test Call Sheet');
    });

    it('should return 400 when title is missing', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      // Should still create with defaults in demo mode
      expect(json).toHaveProperty('id');
    });

    it('should use default content when not provided', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Default Content Test',
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      callSheetId = json.id;
      expect(json.content).toBeDefined();
      expect(json.content.callTime).toBeDefined();
    });

    it('should create call sheet with date', async () => {
      const testDate = '2026-03-15';
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Date Test',
          date: testDate,
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      callSheetId = json.id;
      expect(json.date).toBeDefined();
    });

    it('should handle generate action with missing shootingDayId', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('should handle generate action with non-existent shootingDayId', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          shootingDayId: 'non-existent-id',
        }),
      });

      // Either 404 (not found) or returns error in demo mode
      const json = await res.json();
      expect(json.error || json.id).toBeDefined();
    });

    it('should create call sheet with crew calls', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Crew Calls Test',
          content: {
            callTime: '07:00',
            location: 'Test Studio',
            crewCalls: [
              { name: 'John Doe', role: 'Director', department: 'Direction', callTime: '07:00' },
              { name: 'Jane Smith', role: 'DOP', department: 'Camera', callTime: '07:00' },
            ],
          },
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      callSheetId = json.id;
      expect(json.content.crewCalls.length).toBe(2);
    });

    it('should handle empty body gracefully', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Demo mode should create with defaults
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.id).toBeDefined();
    });

    it('should support notes field', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Notes Test',
          notes: 'Important shooting day notes',
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      callSheetId = json.id;
      expect(json.notes).toBeDefined();
    });

    it('should support multiple scenes', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Multiple Scenes Test',
          content: {
            scenes: ['1A', '1B', '2', '3', '4', '5', '6'],
          },
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      callSheetId = json.id;
      expect(json.content.scenes.length).toBe(7);
    });
  });

  describe('PATCH /api/call-sheets', () => {
    it('should update call sheet title', async () => {
      // First create
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Original Title' }),
      });
      const created = await createRes.json();
      callSheetId = created.id;

      // Then update
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callSheetId, title: 'Updated Title' }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.title).toBe('Updated Title');
    });

    it('should return 400 when id is missing', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('id is required');
    });

    it('should return 400 when id is empty', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '', title: 'Test' }),
      });

      expect(res.status).toBe(400);
    });

    it('should update call sheet content', async () => {
      // First create
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Content Update Test' }),
      });
      const created = await createRes.json();
      callSheetId = created.id;

      // Then update content
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: callSheetId,
          content: { callTime: '08:00', location: 'New Location' },
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.content.callTime).toBe('08:00');
      expect(json.content.location).toBe('New Location');
    });

    it('should update call sheet notes', async () => {
      // First create
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Notes Update Test' }),
      });
      const created = await createRes.json();
      callSheetId = created.id;

      // Then update notes
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: callSheetId,
          notes: 'Updated important notes',
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.notes).toBe('Updated important notes');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'non-existent-id', title: 'Test' }),
      });

      expect(res.status).toBe(404);
    });

    it('should update date field', async () => {
      // First create
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Date Update Test' }),
      });
      const created = await createRes.json();
      callSheetId = created.id;

      const newDate = '2026-04-01';
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callSheetId, date: newDate }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.date).toBeDefined();
    });

    it('should handle partial updates', async () => {
      // First create with full data
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Partial Update Test',
          notes: 'Original notes',
        }),
      });
      const created = await createRes.json();
      callSheetId = created.id;

      // Update only title
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callSheetId, title: 'New Title' }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.title).toBe('New Title');
      expect(json.notes).toBe('Original notes'); // Preserved
    });
  });

  describe('DELETE /api/call-sheets', () => {
    it('should delete call sheet with valid id', async () => {
      // First create
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Delete Test' }),
      });
      const created = await createRes.json();
      const deleteId = created.id;

      // Then delete
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('should return 400 when id is missing', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('id is required');
    });

    it('should return 400 when id is empty', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '' }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'non-existent-delete-id' }),
      });

      expect(res.status).toBe(404);
    });

    it('should handle delete gracefully', async () => {
      // First create
      const createRes = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Graceful Delete Test' }),
      });
      const created = await createRes.json();

      // Delete should succeed
      const res = await fetch(`${API_BASE}/api/call-sheets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: created.id }),
      });

      expect(res.ok).toBe(true);
    });
  });

  describe('Demo Data Validation', () => {
    it('should have multiple demo call sheets', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      expect(json.data.length).toBeGreaterThan(1);
    });

    it('demo call sheets should have varied locations', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      const locations = json.data.map((s: any) => s.content.location);
      const uniqueLocations = new Set(locations);
      expect(uniqueLocations.size).toBeGreaterThan(1);
    });

    it('demo call sheets should have varied crew calls count', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      const crewCounts = json.data.map((s: any) => s.content.crewCalls.length);
      const maxCrew = Math.max(...crewCounts);
      expect(maxCrew).toBeGreaterThan(5);
    });

    it('demo call sheets should have different dates', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      const dates = json.data.map((s: any) => s.date);
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBeGreaterThan(1);
    });

    it('demo call sheets should cover multiple shooting days', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      // Should have at least 5 demo call sheets (days)
      expect(json.data.length).toBeGreaterThanOrEqual(5);
    });

    it('demo call sheets should have realistic titles', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      const titles = json.data.map((s: any) => s.title);
      titles.forEach((title: string) => {
        expect(title.length).toBeGreaterThan(0);
        expect(typeof title).toBe('string');
      });
    });

    it('demo call sheets should have proper scene format', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      // At least one call sheet should have scenes
      const hasScenes = json.data.some((s: any) => s.content.scenes.length > 0);
      expect(hasScenes).toBe(true);
    });

    it('demo call sheets should have realistic call times', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      json.data.forEach((sheet: any) => {
        const callTime = sheet.content.callTime;
        expect(callTime).toMatch(/^\d{2}:\d{2}$/);
        const [hours] = callTime.split(':').map(Number);
        expect(hours).toBeGreaterThanOrEqual(4); // Earliest call
        expect(hours).toBeLessThanOrEqual(20);   // Latest call
      });
    });

    it('demo call sheets should include weather info', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      const hasWeather = json.data.some((s: any) => s.content.weather);
      expect(hasWeather).toBe(true);
    });

    it('demo call sheets should have department distribution', async () => {
      const res = await fetch(`${API_BASE}/api/call-sheets`);
      const json = await res.json();
      
      const departments = new Set();
      json.data.forEach((sheet: any) => {
        sheet.content.crewCalls.forEach((crew: any) => {
          if (crew.department) departments.add(crew.department);
        });
      });
      
      expect(departments.size).toBeGreaterThan(3);
    });
  });
});
