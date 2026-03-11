/**
 * Equipment API Tests
 * Run with: npx jest tests/equipment.test.ts
 */

const API_BASE = 'http://localhost:3000/api/equipment';

describe('Equipment API', () => {
  let createdEquipmentId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (createdEquipmentId) {
      await fetch(`${API_BASE}?id=${createdEquipmentId}`, { method: 'DELETE' });
    }
  });

  const testEquipment = {
    name: 'Test Camera',
    category: 'camera',
    dateStart: '2026-04-01',
    dateEnd: '2026-04-15',
    dailyRate: 5000,
    vendor: 'Test Vendor',
    notes: 'Test notes',
  };

  describe('GET /api/equipment', () => {
    test('returns equipment list with stats', async () => {
      const res = await fetch(API_BASE + '?action=noseed');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('rentals');
      expect(data).toHaveProperty('stats');
      expect(Array.isArray(data.rentals)).toBe(true);
    });

    test('includes stats with required fields', async () => {
      const res = await fetch(API_BASE + '?action=noseed');
      const data = await res.json();

      expect(data.stats).toHaveProperty('totalItems');
      expect(data.stats).toHaveProperty('totalDailyRate');
      expect(data.stats).toHaveProperty('available');
      expect(data.stats).toHaveProperty('inUse');
      expect(typeof data.stats.totalItems).toBe('number');
      expect(typeof data.stats.totalDailyRate).toBe('number');
    });

    test('returns demo data when database unavailable', async () => {
      const res = await fetch(API_BASE + '?action=noseed');
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
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEquipment),
      });
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
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Incomplete' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('PATCH /api/equipment', () => {
    test('updates equipment rental', async () => {
      // First get an equipment ID if we don't have one
      if (!createdEquipmentId) {
        const res = await fetch(API_BASE + '?action=noseed');
        const data = await res.json();
        if (data.rentals.length > 0) {
          createdEquipmentId = data.rentals[0].id;
        } else {
          // Create one if none exists
          const createRes = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testEquipment),
          });
          const createData = await createRes.json();
          createdEquipmentId = createData.rental.id;
        }
      }

      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: createdEquipmentId,
          dailyRate: 7500,
          vendor: 'Updated Vendor',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.rental).toBeDefined();
    });

    test('fails without equipment ID', async () => {
      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('ID is required');
    });
  });

  describe('DELETE /api/equipment', () => {
    test('deletes equipment rental', async () => {
      // First create equipment to delete
      const createRes = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testEquipment,
          name: 'To Delete ' + Date.now(),
        }),
      });
      const createData = await createRes.json();

      const idToDelete = createData.rental.id;

      const res = await fetch(API_BASE + '?id=' + idToDelete, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test('fails without equipment ID', async () => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('ID is required');
    });
  });
});

describe('Equipment Data Validation', () => {
  test('has valid status values', async () => {
    const res = await fetch(API_BASE + '?action=noseed');
    const data = await res.json();

    const validStatuses = ['available', 'in-use', 'maintenance', 'returned'];
    
    data.rentals.forEach((item: { status: string }) => {
      expect(validStatuses).toContain(item.status);
    });
  });

  test('calculates correct daily rate totals', async () => {
    const res = await fetch(API_BASE + '?action=noseed');
    const data = await res.json();

    const calculatedTotal = data.rentals.reduce(
      (sum: number, item: { dailyRate: number }) => sum + item.dailyRate,
      0
    );

    expect(calculatedTotal).toBe(data.stats.totalDailyRate);
  });

  test('calculates correct available count', async () => {
    const res = await fetch(API_BASE + '?action=noseed');
    const data = await res.json();

    const availableCount = data.rentals.filter(
      (item: { status: string }) => item.status === 'available'
    ).length;

    expect(availableCount).toBe(data.stats.available);
  });

  test('calculates correct in-use count', async () => {
    const res = await fetch(API_BASE + '?action=noseed');
    const data = await res.json();

    const inUseCount = data.rentals.filter(
      (item: { status: string }) => item.status === 'in-use'
    ).length;

    expect(inUseCount).toBe(data.stats.inUse);
  });
});
