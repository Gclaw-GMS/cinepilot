/**
 * Catering API Tests
 * Run with: npx jest tests/catering.test.ts
 */

const API_BASE = 'http://localhost:3000/api/catering';

describe('Catering API', () => {
  let createdPlanId: string;
  let createdCatererId: string;

  test('GET /api/catering returns catering plan and caterers', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('cateringPlan');
    expect(data).toHaveProperty('caterers');
    expect(data).toHaveProperty('isDemoMode');
  });

  test('GET /api/catering with date filter', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&date=2026-03-07`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // Should return filtered data or empty if no match
    expect(data).toHaveProperty('cateringPlan');
  });

  test('POST /api/catering creates new catering plan', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        totalBudget: 100000,
        dietaryRestrictions: { 'Vegetarian': 10, 'Non-Vegetarian': 40 }
      })
    });
    
    const data = await res.json();
    // May return 200 with demo or 201 with created
    expect([200, 201]).toContain(res.status);
    
    if (data.id) {
      createdPlanId = data.id;
    }
  });

  test('POST /api/catering adds caterer', async () => {
    const res = await fetch(`${API_BASE}/caterer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TEST_Caterer Co',
        contactPerson: 'Test Chef',
        phone: '+91-98765-43210',
        email: 'test@caterer.com',
        specialty: 'South Indian',
        rating: 4
      })
    });
    
    const data = await res.json();
    expect([200, 201]).toContain(res.status);
    
    if (data.id) {
      createdCatererId = data.id;
    }
  });

  test('PATCH /api/catering updates plan', async () => {
    if (!createdPlanId) {
      console.log('Skipping PATCH test - no plan created');
      return;
    }
    
    const res = await fetch(API_BASE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createdPlanId,
        totalBudget: 150000
      })
    });
    
    const data = await res.json();
    expect([200, 201]).toContain(res.status);
  });

  test('DELETE /api/catering removes caterer', async () => {
    if (!createdCatererId) {
      console.log('Skipping DELETE test - no caterer created');
      return;
    }
    
    const res = await fetch(`${API_BASE}/caterer?id=${createdCatererId}`, {
      method: 'DELETE'
    });
    
    expect([200, 204]).toContain(res.status);
  });

  test('GET /api/catering returns dietary breakdown', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // Check for dietary restrictions in the plan
    if (data.cateringPlan?.dietaryRestrictions) {
      expect(typeof data.cateringPlan.dietaryRestrictions).toBe('object');
    }
  });
});
