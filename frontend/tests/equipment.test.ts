/**
 * Equipment API Tests
 * Run with: npx jest tests/equipment.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH, DELETE } from '@/app/api/equipment/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/equipment');
  
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

const testEquipment = {
  name: 'Test Camera',
  category: 'camera',
  dateStart: '2026-04-01',
  dateEnd: '2026-04-15',
  dailyRate: 5000,
  vendor: 'Test Vendor',
  notes: 'Test notes',
};

describe('Equipment API', () => {
  let createdEquipmentId: string;

  describe('GET /api/equipment', () => {
    test('returns equipment list with stats', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('rentals');
      expect(data).toHaveProperty('stats');
      expect(Array.isArray(data.rentals)).toBe(true);
    });

    test('includes stats with required fields', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
      const res = await GET(req);
      const data = await res.json();

      expect(data.stats).toHaveProperty('totalItems');
      expect(data.stats).toHaveProperty('totalDailyRate');
      expect(data.stats).toHaveProperty('available');
      expect(data.stats).toHaveProperty('inUse');
      expect(typeof data.stats.totalItems).toBe('number');
      expect(typeof data.stats.totalDailyRate).toBe('number');
    });

    test('returns demo data when database unavailable', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
      const res = await GET(req);
      const data = await res.json();

      // Should return demo data structure
      expect(data.rentals).toBeDefined();
      if (data.rentals.length > 0) {
        const first = data.rentals[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('name');
        expect(first).toHaveProperty('category');
        expect(first).toHaveProperty('dailyRate');
        expect(first).toHaveProperty('status');
      }
    });
  });

  describe('POST /api/equipment', () => {
    test('creates new equipment rental with all fields', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: testEquipment 
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('rental');
      expect(data.rental).toHaveProperty('id');
      expect(data.rental.name).toBe(testEquipment.name);
      expect(data.rental.category).toBe(testEquipment.category);
      expect(data.rental.dailyRate).toBe(testEquipment.dailyRate);

      createdEquipmentId = data.rental.id;
    });

    test('fails without required fields', async () => {
      const req = createRequest({ 
        method: 'POST', 
        body: { name: 'Incomplete' } 
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('PATCH /api/equipment', () => {
    test('updates equipment rental', async () => {
      // First get an equipment ID if we don't have one
      if (!createdEquipmentId) {
        const getReq = createRequest({ method: 'GET', params: { action: 'noseed' } });
        const getRes = await GET(getReq);
        const getData = await getRes.json();
        if (getData.rentals.length > 0) {
          createdEquipmentId = getData.rentals[0].id;
        } else {
          // Create one if none exists
          const createReq = createRequest({ 
            method: 'POST', 
            body: testEquipment 
          });
          const createRes = await POST(createReq);
          const createData = await createRes.json();
          createdEquipmentId = createData.rental.id;
        }
      }

      const req = createRequest({ 
        method: 'PATCH', 
        body: {
          id: createdEquipmentId,
          dailyRate: 7500,
          vendor: 'Updated Vendor',
        }
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.rental).toBeDefined();
    });

    test('fails without equipment ID', async () => {
      const req = createRequest({ 
        method: 'PATCH', 
        body: { name: 'New Name' } 
      });
      const res = await PATCH(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('ID is required');
    });
  });

  describe('DELETE /api/equipment', () => {
    test('deletes equipment rental', async () => {
      // First create equipment to delete
      const createReq = createRequest({ 
        method: 'POST', 
        body: {
          ...testEquipment,
          name: 'To Delete ' + Date.now(),
        }
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();

      const idToDelete = createData.rental.id;

      const req = createRequest({ 
        method: 'DELETE', 
        params: { id: idToDelete } 
      });
      const res = await DELETE(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test('fails without equipment ID', async () => {
      const req = createRequest({ method: 'DELETE' });
      const res = await DELETE(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('ID is required');
    });
  });
});

describe('Equipment Data Validation', () => {
  test('has valid status values', async () => {
    const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
    const res = await GET(req);
    const data = await res.json();

    const validStatuses = ['available', 'in-use', 'maintenance', 'returned'];
    
    data.rentals.forEach((item: { status: string }) => {
      expect(validStatuses).toContain(item.status);
    });
  });

  test('calculates correct daily rate totals', async () => {
    const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
    const res = await GET(req);
    const data = await res.json();

    const calculatedTotal = data.rentals.reduce(
      (sum: number, item: { dailyRate: number }) => sum + item.dailyRate,
      0
    );

    expect(calculatedTotal).toBe(data.stats.totalDailyRate);
  });

  test('calculates correct available count', async () => {
    const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
    const res = await GET(req);
    const data = await res.json();

    const availableCount = data.rentals.filter(
      (item: { status: string }) => item.status === 'available'
    ).length;

    expect(availableCount).toBe(data.stats.available);
  });

  test('calculates correct in-use count', async () => {
    const req = createRequest({ method: 'GET', params: { action: 'noseed' } });
    const res = await GET(req);
    const data = await res.json();

    const inUseCount = data.rentals.filter(
      (item: { status: string }) => item.status === 'in-use'
    ).length;

    expect(inUseCount).toBe(data.stats.inUse);
  });
});
