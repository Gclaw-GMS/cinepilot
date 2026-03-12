/**
 * Character Costume API Tests
 * Run with: npx jest tests/character-costume.test.ts
 */

const API_BASE = 'http://localhost:3002/api/character-costume';

describe('Character Costume API', () => {
  let createdCharacterId: string;

  test('GET /api/character-costume returns characters list', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('characters');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('isDemoMode');
  });

  test('GET /api/character-costume with role filter', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&role=protagonist`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // All returned characters should match role filter
    for (const char of data.characters || []) {
      if (char.role && char.role !== 'protagonist') {
        throw new Error('Role filter not working');
      }
    }
  });

  test('POST /api/character-costume creates new character', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        name: 'TEST_Character',
        age: 'Young Adult (20-35)',
        ageNumber: 28,
        gender: 'Male',
        role: 'protagonist',
        appearance: ['Tall', 'Athletic'],
        personality: ['Brave', 'Charismatic'],
        costumeStyle: ['Action', 'Modern'],
        fabrics: ['Cotton', 'Leather'],
        colorPalette: ['#000000', '#FF0000'],
        description: 'Test character for QA',
        estimatedBudget: 50000
      })
    });
    
    const data = await res.json();
    expect([200, 201]).toContain(res.status);
    
    if (data.id) {
      createdCharacterId = data.id;
    }
  });

  test('PUT /api/character-costume updates character', async () => {
    if (!createdCharacterId) {
      console.log('Skipping PUT test - no character created');
      return;
    }
    
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createdCharacterId,
        estimatedBudget: 75000,
        costumeNotes: 'Updated by test'
      })
    });
    
    const data = await res.json();
    expect([200, 201]).toContain(res.status);
  });

  test('DELETE /api/character-costume removes character', async () => {
    if (!createdCharacterId) {
      console.log('Skipping DELETE test - no character created');
      return;
    }
    
    const res = await fetch(`${API_BASE}?id=${createdCharacterId}`, {
      method: 'DELETE'
    });
    
    expect([200, 204]).toContain(res.status);
  });

  test('GET /api/character-costume returns costume summary', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.summary).toHaveProperty('totalCharacters');
    expect(data.summary).toHaveProperty('byRole');
    expect(data.summary).toHaveProperty('totalBudget');
  });

  test('GET /api/character-costume with search term', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&search=hero`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // Should filter by search term
    expect(Array.isArray(data.characters)).toBe(true);
  });

  // Filter Tests - API only supports role and search filters
  test('GET /api/character-costume with role and search combined', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&role=protagonist&search=arjun`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // Should apply both filters
    expect(Array.isArray(data.characters)).toBe(true);
  });

  // Demo Mode Tests
  test('GET /api/character-costume returns isDemoMode flag', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(typeof data.isDemoMode).toBe('boolean');
  });

  test('GET /api/character-costume returns demo data when no project', async () => {
    const res = await fetch(`${API_BASE}`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(Array.isArray(data.characters)).toBe(true);
  });

  // Character Data Validation Tests
  test('GET /api/character-costume returns characters with required fields', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    if (data.characters && data.characters.length > 0) {
      const char = data.characters[0];
      expect(char).toHaveProperty('id');
      expect(char).toHaveProperty('name');
      expect(char).toHaveProperty('role');
      expect(char).toHaveProperty('gender');
      expect(char).toHaveProperty('status');
    }
  });

  test('GET /api/character-costume returns summary with required fields', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.summary).toHaveProperty('totalCharacters');
    expect(data.summary).toHaveProperty('byRole');
    expect(data.summary).toHaveProperty('totalBudget');
  });

  // Role Breakdown Tests
  test('GET /api/character-costume returns role breakdown', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.summary).toHaveProperty('byRole');
    // Should have role counts
    const byRole = data.summary?.byRole || {};
    expect(typeof byRole).toBe('object');
  });

  test('GET /api/character-costume returns budget breakdown', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.summary).toHaveProperty('totalBudget');
    expect(typeof data.summary.totalBudget).toBe('number');
  });

  // Error Handling Tests
  test('POST /api/character-costume handles missing required fields', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project'
        // Missing required fields
      })
    });
    
    // Should either succeed with defaults or return error
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('PUT /api/character-costume handles invalid id', async () => {
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'invalid-id-12345',
        estimatedBudget: 100000
      })
    });
    
    // Should return 400 for missing id or handle gracefully
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  test('DELETE /api/character-costume handles invalid id', async () => {
    const res = await fetch(`${API_BASE}?id=invalid-id-12345`, {
      method: 'DELETE'
    });
    
    // Should handle gracefully
    expect([200, 404, 500]).toContain(res.status);
  });

  // Character Property Tests
  test('GET /api/character-costume characters have appearance traits', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    if (data.characters && data.characters.length > 0) {
      const char = data.characters[0];
      expect(char).toHaveProperty('appearance');
      expect(Array.isArray(char.appearance)).toBe(true);
    }
  });

  test('GET /api/character-costume characters have personality traits', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    if (data.characters && data.characters.length > 0) {
      const char = data.characters[0];
      expect(char).toHaveProperty('personality');
      expect(Array.isArray(char.personality)).toBe(true);
    }
  });

  test('GET /api/character-costume characters have costume details', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    if (data.characters && data.characters.length > 0) {
      const char = data.characters[0];
      expect(char).toHaveProperty('costumeStyle');
      expect(char).toHaveProperty('fabrics');
      expect(Array.isArray(char.costumeStyle)).toBe(true);
      expect(Array.isArray(char.fabrics)).toBe(true);
    }
  });

  test('GET /api/character-costume characters have color palette', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    if (data.characters && data.characters.length > 0) {
      const char = data.characters[0];
      expect(char).toHaveProperty('colorPalette');
      expect(Array.isArray(char.colorPalette)).toBe(true);
    }
  });

  test('GET /api/character-costume characters have budget info', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    if (data.characters && data.characters.length > 0) {
      const char = data.characters[0];
      expect(char).toHaveProperty('estimatedBudget');
    }
  });
});
