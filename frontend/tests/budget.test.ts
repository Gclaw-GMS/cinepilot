/**
 * Budget API Tests
 * Run with: npx jest tests/budget.test.ts
 */

const API_BASE = 'http://localhost:3002/api/budget';

describe('Budget API', () => {
  let createdExpenseId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('GET /api/budget', () => {
    test('returns budget data with items, expenses, and forecast', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('expenses');
      expect(data).toHaveProperty('forecast');
      expect(Array.isArray(data.items)).toBe(true);
      expect(Array.isArray(data.expenses)).toBe(true);
    });

    test('includes forecast with required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(data.forecast).toHaveProperty('planned');
      expect(data.forecast).toHaveProperty('actual');
      expect(data.forecast).toHaveProperty('eacTotal');
      expect(data.forecast).toHaveProperty('variance');
      expect(data.forecast).toHaveProperty('percentSpent');
      expect(data.forecast).toHaveProperty('categories');
      expect(typeof data.forecast.planned).toBe('number');
      expect(typeof data.forecast.percentSpent).toBe('number');
    });

    test('forecast categories have status field', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.forecast.categories && data.forecast.categories.length > 0) {
        const firstCategory = data.forecast.categories[0];
        expect(firstCategory).toHaveProperty('category');
        expect(firstCategory).toHaveProperty('planned');
        expect(firstCategory).toHaveProperty('actual');
        expect(firstCategory).toHaveProperty('forecast');
        expect(firstCategory).toHaveProperty('status');
      }
    });

    test('returns demo data when database unavailable', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      // Should return demo data structure
      expect(data.items).toBeDefined();
      expect(data.expenses).toBeDefined();
      expect(data.forecast).toBeDefined();
      
      // Demo data should have _demo flag
      expect(data._demo).toBe(true);
    });

    test('demo items have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.items.length > 0) {
        const first = data.items[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('category');
        expect(first).toHaveProperty('description');
        expect(first).toHaveProperty('quantity');
        expect(first).toHaveProperty('unit');
        expect(first).toHaveProperty('rate');
        expect(first).toHaveProperty('total');
        expect(first).toHaveProperty('source');
      }
    });

    test('demo expenses have required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.expenses.length > 0) {
        const first = data.expenses[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('category');
        expect(first).toHaveProperty('description');
        expect(first).toHaveProperty('amount');
        expect(first).toHaveProperty('date');
        expect(first).toHaveProperty('status');
      }
    });
  });

  describe('GET /api/budget?action=forecast', () => {
    test('returns forecast data only', async () => {
      const res = await fetch(API_BASE + '?action=forecast');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('totalPlanned');
      expect(data).toHaveProperty('totalActual');
      expect(data).toHaveProperty('variance');
      expect(data).toHaveProperty('percentSpent');
      expect(data).toHaveProperty('forecast');
    });

    test('forecast includes category breakdown', async () => {
      const res = await fetch(API_BASE + '?action=forecast');
      const data = await res.json();

      expect(data.forecast).toBeDefined();
      expect(Array.isArray(data.forecast.categories)).toBe(true);
    });
  });

  describe('POST /api/budget', () => {
    test('generates budget with valid action', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate',
          targetScale: 'mid',
          region: 'Tamil Nadu'
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('totalPlanned');
    });

    test('adds expense with all required fields', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addExpense',
          category: 'Production',
          description: 'Test Expense',
          amount: 50000,
          date: '2026-03-15',
          vendor: 'Test Vendor',
          notes: 'Test notes',
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('expense');
      
      if (data.expense) {
        createdExpenseId = data.expense.id;
        expect(data.expense.category).toBe('Production');
        expect(data.expense.description).toBe('Test Expense');
      }
    });

    test('addExpense fails without required fields', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addExpense',
          description: 'Incomplete',
        }),
      });

      // Should handle missing fields gracefully
      expect(res.status).toBe(200);
    });

    test('invalid action returns 400', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'invalid_action' 
        }),
      });

      expect(res.status).toBe(400);
    });

    test('generate with different scales works', async () => {
      const scales = ['micro', 'indie', 'mid', 'big'];
      
      for (const scale of scales) {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'generate',
            targetScale: scale,
            region: 'Tamil Nadu'
          }),
        });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.items).toBeDefined();
      }
    });
  });

  describe('Data validation', () => {
    test('budget items have numeric totals', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.items.length > 0) {
        const item = data.items[0];
        expect(typeof item.total).toBe('string');
        const totalNum = parseFloat(item.total);
        expect(!isNaN(totalNum)).toBe(true);
      }
    });

    test('expenses have numeric amounts', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      if (data.expenses.length > 0) {
        const expense = data.expenses[0];
        expect(typeof expense.amount).toBe('string');
        const amountNum = parseFloat(expense.amount);
        expect(!isNaN(amountNum)).toBe(true);
      }
    });

    test('forecast variance is calculated correctly', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      const { planned, actual } = data.forecast;
      const expectedVariance = planned - actual;
      expect(data.forecast.variance).toBe(expectedVariance);
    });

    test('percentSpent is between 0 and 100', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(data.forecast.percentSpent).toBeGreaterThanOrEqual(0);
      expect(data.forecast.percentSpent).toBeLessThanOrEqual(100);
    });
  });
});
