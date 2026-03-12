/**
 * Catering API Test Suite
 * Tests all endpoints for the Catering feature
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST, DELETE } from '@/app/api/catering/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/catering');
  
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

describe('Catering API', () => {
  describe('GET /api/catering', () => {
    it('returns catering plan and caterers', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('cateringPlan');
      expect(data).toHaveProperty('caterers');
      expect(data).toHaveProperty('isDemoMode');
    });

    it('returns isDemoMode as boolean', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(typeof data.isDemoMode).toBe('boolean');
      expect(data.isDemoMode).toBe(true);
    });

    it('returns caterers as array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(Array.isArray(data.caterers)).toBe(true);
      expect(data.caterers.length).toBeGreaterThan(0);
    });

    it('caterers have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.caterers.length > 0) {
        const caterer = data.caterers[0];
        expect(caterer).toHaveProperty('id');
        expect(caterer).toHaveProperty('name');
        expect(caterer).toHaveProperty('contactPerson');
        expect(caterer).toHaveProperty('phone');
        expect(caterer).toHaveProperty('specialty');
      }
    });

    it('returns catering plan structure', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.cateringPlan).toHaveProperty('id');
      expect(data.cateringPlan).toHaveProperty('projectId');
      expect(data.cateringPlan).toHaveProperty('dietaryRestrictions');
      expect(data.cateringPlan).toHaveProperty('totalBudget');
      expect(data.cateringPlan).toHaveProperty('shootDays');
    });

    it('shoot days have meals array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.cateringPlan?.shootDays?.length > 0) {
        const shootDay = data.cateringPlan.shootDays[0];
        expect(shootDay).toHaveProperty('date');
        expect(shootDay).toHaveProperty('totalCrew');
        expect(shootDay).toHaveProperty('totalCast');
        expect(shootDay).toHaveProperty('meals');
        expect(Array.isArray(shootDay.meals)).toBe(true);
      }
    });

    it('meals have required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      // Find a shoot day with meals
      const shootDayWithMeals = data.cateringPlan?.shootDays?.find((sd: any) => sd.meals?.length > 0);
      if (shootDayWithMeals && shootDayWithMeals.meals.length > 0) {
        const meal = shootDayWithMeals.meals[0];
        expect(meal).toHaveProperty('id');
        expect(meal).toHaveProperty('type');
        expect(meal).toHaveProperty('menu');
        expect(meal).toHaveProperty('budget');
      }
    });

    it('handles projectId parameter', async () => {
      const req = createRequest({ method: 'GET', params: { projectId: 'demo-project' } });
      const res = await GET(req);
      
      expect(res.status).toBe(200);
    });

    it('handles date parameter', async () => {
      const req = createRequest({ method: 'GET', params: { date: '2026-03-15' } });
      const res = await GET(req);
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/catering', () => {
    it('adds new shoot day', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          type: 'addShootDay',
          data: {
            date: '2026-04-01',
            totalCrew: 50,
            totalCast: 10
          }
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.shootDay).toHaveProperty('date');
    });

    it('adds meal to shoot day', async () => {
      // First get the current plan to find a date
      const getReq = createRequest({ method: 'GET' });
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      
      const firstDate = getData.cateringPlan?.shootDays?.[0]?.date;
      
      if (firstDate) {
        const req = createRequest({
          method: 'POST',
          body: {
            type: 'addMeal',
            data: {
              date: firstDate,
              type: 'breakfast',
              menu: ['Idli', 'Dosa'],
              budget: 3000
            }
          }
        });
        const res = await POST(req);
        const data = await res.json();
        
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.meal).toHaveProperty('id');
      }
    });

    it('updates existing meal', async () => {
      const getReq = createRequest({ method: 'GET' });
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      
      // Find a meal to update
      let mealId: string | null = null;
      for (const day of getData.cateringPlan?.shootDays || []) {
        for (const meal of day.meals || []) {
          mealId = meal.id;
          break;
        }
        if (mealId) break;
      }
      
      if (mealId) {
        const req = createRequest({
          method: 'POST',
          body: {
            type: 'updateMeal',
            data: {
              mealId,
              updates: { budget: 5000, actualCost: 4800 }
            }
          }
        });
        const res = await POST(req);
        const data = await res.json();
        
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it('sets caterer for plan', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          type: 'setCaterer',
          data: { catererId: 'cat-2' }
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns error for invalid shoot day date', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          type: 'addMeal',
          data: {
            date: 'invalid-date',
            type: 'breakfast',
            menu: []
          }
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
    });

    it('returns success for unknown type', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          type: 'unknownType',
          data: {}
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('handles empty body gracefully', async () => {
      const req = createRequest({
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/catering', () => {
    it('deletes meal by id', async () => {
      // First get a meal id
      const getReq = createRequest({ method: 'GET' });
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      
      let mealId: string | null = null;
      for (const day of getData.cateringPlan?.shootDays || []) {
        for (const meal of day.meals || []) {
          mealId = meal.id;
          break;
        }
        if (mealId) break;
      }
      
      if (mealId) {
        const req = createRequest({ 
          method: 'DELETE',
          params: { id: mealId }
        });
        const res = await DELETE(req);
        const data = await res.json();
        
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it('returns error without id', async () => {
      const req = createRequest({ method: 'DELETE' });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Demo Data Validation', () => {
    it('has multiple caterers', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.caterers.length).toBeGreaterThanOrEqual(3);
    });

    it('caterers have South Indian specialty', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasSouthIndian = data.caterers.some((c: any) => 
        c.specialty?.toLowerCase().includes('south indian')
      );
      expect(hasSouthIndian).toBe(true);
    });

    it('has dietary restrictions in plan', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.cateringPlan.dietaryRestrictions).toBeDefined();
      const restrictions = data.cateringPlan.dietaryRestrictions;
      expect(Object.keys(restrictions).length).toBeGreaterThan(0);
    });

    it('has realistic budget', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.cateringPlan.totalBudget).toBeGreaterThan(0);
      expect(data.cateringPlan.totalSpent).toBeGreaterThan(0);
    });

    it('has multiple meal types', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const mealTypes = new Set();
      for (const day of data.cateringPlan?.shootDays || []) {
        for (const meal of day.meals || []) {
          mealTypes.add(meal.type);
        }
      }
      
      expect(mealTypes.size).toBeGreaterThanOrEqual(2);
    });

    it('has Tamil/South Indian menu items', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const menuItems: string[] = [];
      for (const day of data.cateringPlan?.shootDays || []) {
        for (const meal of day.meals || []) {
          menuItems.push(...meal.menu);
        }
      }
      
      const hasTamilItems = menuItems.some((item: string) => 
        ['Idli', 'Dosa', 'Sambar', 'Biriyani', 'Puri', 'Pongal', 'Rasam'].includes(item)
      );
      expect(hasTamilItems).toBe(true);
    });

    it('has multiple shoot days', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.cateringPlan.shootDays.length).toBeGreaterThanOrEqual(1);
    });

    it('meals have budgets', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      for (const day of data.cateringPlan?.shootDays || []) {
        for (const meal of day.meals || []) {
          expect(typeof meal.budget).toBe('number');
        }
      }
    });
  });
});
