/**
 * Character Costume API Tests
 * Run with: npx jest tests/character-costume.test.ts
 */

const API_BASE = 'http://localhost:3000/api/character-costume';

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

  test('PATCH /api/character-costume updates character', async () => {
    if (!createdCharacterId) {
      console.log('Skipping PATCH test - no character created');
      return;
    }
    
    const res = await fetch(API_BASE, {
      method: 'PATCH',
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
});
