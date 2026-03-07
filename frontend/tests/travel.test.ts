/**
 * Travel Expenses API Tests
 * Run with: npx jest tests/travel.test.ts
 */

const API_BASE = 'http://localhost:3000/api/travel';

describe('Travel Expenses API', () => {
  let createdExpenseId: string;

  beforeAll(async () => {
    // Clean up any test expenses
    const res = await fetch(API_BASE);
    const data = await res.json();
    for (const exp of data.expenses || []) {
      if (exp.description.includes('TEST_')) {
        await fetch(`${API_BASE}?id=${exp.id}`, { method: 'DELETE' });
      }
    }
  });

  test('GET /api/travel returns expenses list', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('expenses');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('isDemoMode');
  });

  test('POST /api/travel creates new expense', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Flight',
        description: 'TEST_Flight for actor',
        amount: 10000,
        date: '2026-03-15',
        vendor: 'SpiceJet',
        status: 'pending',
        notes: 'Test expense'
      })
    });
    
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data.category).toBe('Flight');
    expect(data.amount).toBe(10000);
    
    createdExpenseId = data.id;
  });

  test('PATCH /api/travel updates expense', async () => {
    if (!createdExpenseId) {
      console.log('Skipping PATCH test - no expense created');
      return;
    }
    
    const res = await fetch(API_BASE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createdExpenseId,
        status: 'approved',
        amount: 12000
      })
    });
    
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('approved');
    expect(data.amount).toBe(12000);
  });

  test('DELETE /api/travel removes expense', async () => {
    if (!createdExpenseId) {
      console.log('Skipping DELETE test - no expense created');
      return;
    }
    
    const res = await fetch(`${API_BASE}?id=${createdExpenseId}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /api/travel with filters', async () => {
    const res = await fetch(`${API_BASE}?category=Flight&status=approved`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // All returned expenses should match filters
    for (const exp of data.expenses) {
      if (exp.category !== 'Flight') {
        throw new Error('Filter not working: got non-Flight expense');
      }
    }
  });
});
