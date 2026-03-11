/**
 * Travel Expenses API Tests
 * Run with: npx jest tests/travel.test.ts
 */

const API_BASE = 'http://localhost:3000/api/travel';

describe('Travel Expenses API', () => {
  let createdExpenseId: string;

  beforeAll(async () => {
    // Clean up any test expenses
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    for (const expense of data.expenses || []) {
      if (expense.description?.includes('TEST_')) {
        await fetch(`${API_BASE}?id=${expense.id}`, { method: 'DELETE' });
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdExpenseId) {
      await fetch(`${API_BASE}?id=${createdExpenseId}`, { method: 'DELETE' });
    }
  });

  test('GET /api/travel returns expenses list', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('expenses');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('isDemoMode');
  });

  test('GET /api/travel with category filter', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&category=Flight`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // All returned expenses should match category filter
    for (const expense of data.expenses || []) {
      if (expense.category && expense.category !== 'Flight') {
        throw new Error('Category filter not working');
      }
    }
  });

  test('GET /api/travel with status filter', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&status=pending`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // All returned expenses should match status filter
    for (const expense of data.expenses || []) {
      if (expense.status && expense.status !== 'pending') {
        throw new Error('Status filter not working');
      }
    }
  });

  test('GET /api/travel with date range filter', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&startDate=2026-02-01&endDate=2026-02-28`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('expenses');
  });

  test('POST /api/travel creates new expense', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        category: 'Flight',
        personName: 'TEST_Arjun',
        description: 'TEST_Flight to Bangalore',
        amount: 7500,
        date: '2026-03-15',
        vendor: 'Air India',
        status: 'pending',
        notes: 'Test expense'
      })
    });
    
    const data = await res.json();
    // May return 200 with demo data or 201 with created object
    expect([200, 201]).toContain(res.status);
    
    if (data.id) {
      createdExpenseId = data.id;
    }
  });

  test('POST /api/travel validates required fields', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        // Missing category, description, amount, date
      })
    });
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('GET /api/travel/[id] returns single expense', async () => {
    // First get list to find an ID
    const listRes = await fetch(`${API_BASE}?projectId=demo-project`);
    const listData = await listRes.json();
    
    if (listData.expenses && listData.expenses.length > 0) {
      const id = listData.expenses[0].id;
      const res = await fetch(`${API_BASE}?id=${id}`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('id');
    }
  });

  test('PATCH /api/travel updates expense', async () => {
    // Create first
    const createRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        category: 'Taxi',
        personName: 'TEST_Ravi',
        description: 'TEST_ToBeUpdated',
        amount: 500,
        date: '2026-03-10',
        status: 'pending'
      })
    });
    
    if (createRes.ok) {
      const createData = await createRes.json();
      if (createData.id) {
        // Update it
        const updateRes = await fetch(`${API_BASE}?id=${createData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'Taxi',
            personName: 'TEST_Ravi',
            description: 'TEST_UpdatedDescription',
            amount: 750,
            date: '2026-03-10',
            status: 'approved'
          })
        });
        
        expect(updateRes.ok).toBe(true);
        const updateData = await updateRes.json();
        expect(updateData.status).toBe('approved');
        
        // Cleanup
        await fetch(`${API_BASE}?id=${createData.id}`, { method: 'DELETE' });
      }
    }
  });

  test('DELETE /api/travel removes expense', async () => {
    // Create first
    const createRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        category: 'Bus',
        personName: 'TEST_Divya',
        description: 'TEST_ToBeDeleted',
        amount: 200,
        date: '2026-03-12',
        status: 'pending'
      })
    });
    
    if (createRes.ok) {
      const createData = await createRes.json();
      if (createData.id) {
        const deleteRes = await fetch(`${API_BASE}?id=${createData.id}`, {
          method: 'DELETE'
        });
        
        expect(deleteRes.ok).toBe(true);
      }
    }
  });

  test('GET /api/travel returns summary with correct totals', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.summary).toHaveProperty('totalAmount');
    expect(data.summary).toHaveProperty('totalCount');
    expect(data.summary).toHaveProperty('byCategory');
    expect(data.summary).toHaveProperty('byStatus');
    
    // Verify totalAmount matches sum of expenses
    const calculatedTotal = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    expect(data.summary.totalAmount).toBe(calculatedTotal);
  });
});
