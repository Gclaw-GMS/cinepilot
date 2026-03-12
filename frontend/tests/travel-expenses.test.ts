import { fetch } from '@jest/globals'
import { describe, test, expect, beforeAll } from '@jest/globals'

const API_BASE = 'http://localhost:3000/api/travel-expenses'

describe('Travel Expenses API', () => {
  describe('GET /api/travel-expenses', () => {
    test('returns travel expenses array', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    test('expenses have required fields', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()
      const expense = data[0]

      expect(expense).toHaveProperty('id')
      expect(expense).toHaveProperty('projectId')
      expect(expense).toHaveProperty('category')
      expect(expense).toHaveProperty('description')
      expect(expense).toHaveProperty('amount')
      expect(expense).toHaveProperty('date')
      expect(expense).toHaveProperty('status')
    })

    test('amount is numeric', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()

      for (const expense of data) {
        expect(typeof expense.amount).toBe('number')
        expect(expense.amount).toBeGreaterThan(0)
      }
    })

    test('status is valid', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()
      const validStatuses = ['pending', 'approved', 'rejected', 'reimbursed']

      for (const expense of data) {
        expect(validStatuses).toContain(expense.status)
      }
    })

    test('category is valid', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()
      const validCategories = ['flight', 'train', 'bus', 'taxi', 'auto', 'hotel', 'stay', 'per_diem', 'daily_allowance']

      for (const expense of data) {
        expect(validCategories).toContain(expense.category)
      }
    })

    test('filter by projectId', async () => {
      const res = await fetch(`${API_BASE}?projectId=demo-project`)
      const data = await res.json()

      expect(data.length).toBeGreaterThan(0)
      for (const expense of data) {
        expect(expense.projectId).toBe('demo-project')
      }
    })

    test('filter by category', async () => {
      const res = await fetch(`${API_BASE}?category=flight`)
      const data = await res.json()

      for (const expense of data) {
        expect(expense.category).toBe('flight')
      }
    })

    test('filter by status', async () => {
      const res = await fetch(`${API_BASE}?status=pending`)
      const data = await res.json()

      for (const expense of data) {
        expect(expense.status).toBe('pending')
      }
    })
  })

  describe('GET /api/travel-expenses?action=summary', () => {
    test('returns summary with categories', async () => {
      const res = await fetch(`${API_BASE}?action=summary`)
      const data = await res.json()

      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('totals')
      expect(Array.isArray(data.summary)).toBe(true)
    })

    test('summary has category totals', async () => {
      const res = await fetch(`${API_BASE}?action=summary`)
      const data = await res.json()

      expect(data.summary.length).toBeGreaterThan(0)
      expect(data.summary[0]).toHaveProperty('category')
      expect(data.summary[0]).toHaveProperty('total')
      expect(data.summary[0]).toHaveProperty('count')
      expect(data.summary[0]).toHaveProperty('pending')
      expect(data.summary[0]).toHaveProperty('approved')
    })

    test('totals has correct structure', async () => {
      const res = await fetch(`${API_BASE}?action=summary`)
      const data = await res.json()

      expect(data.totals).toHaveProperty('totalSpent')
      expect(data.totals).toHaveProperty('pendingAmount')
      expect(data.totals).toHaveProperty('approvedAmount')
      expect(data.totals).toHaveProperty('reimbursedAmount')
      expect(data.totals).toHaveProperty('totalExpenses')
    })

    test('totals are numeric', async () => {
      const res = await fetch(`${API_BASE}?action=summary`)
      const data = await res.json()

      expect(typeof data.totals.totalSpent).toBe('number')
      expect(typeof data.totals.pendingAmount).toBe('number')
      expect(typeof data.totals.approvedAmount).toBe('number')
      expect(typeof data.totals.reimbursedAmount).toBe('number')
      expect(typeof data.totals.totalExpenses).toBe('number')
    })

    test('isDemoMode is boolean', async () => {
      const res = await fetch(`${API_BASE}?action=summary`)
      const data = await res.json()

      expect(typeof data.isDemoMode).toBe('boolean')
    })
  })

  describe('POST /api/travel-expenses', () => {
    test('creates new expense', async () => {
      const newExpense = {
        action: 'create',
        category: 'flight',
        description: 'Test flight',
        amount: 5000,
        date: '2026-03-20',
        vendor: 'Test Airlines',
        status: 'pending'
      }

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data).toHaveProperty('id')
      expect(data.category).toBe('flight')
      expect(data.description).toBe('Test flight')
      expect(data.amount).toBe(5000)
    })

    test('update expense', async () => {
      const updateData = {
        action: 'update',
        id: '1',
        status: 'approved',
        amount: 15000
      }

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()
      expect(data.status).toBe('approved')
      expect(data.amount).toBe(15000)
    })

    test('delete expense', async () => {
      // First create one
      const newExpense = {
        action: 'create',
        category: 'taxi',
        description: 'Test taxi to delete',
        amount: 500,
        status: 'pending'
      }

      const createRes = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      })
      const created = await createRes.json()
      const idToDelete = created.id

      // Delete it
      const deleteRes = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: idToDelete })
      })

      expect(deleteRes.status).toBe(200)
    })

    test('reset to demo data', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      })

      const data = await res.json()
      expect(data.success).toBe(true)
    })

    test('handles missing fields gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      // Should handle gracefully
      expect([200, 400]).toContain(res.status)
    })
  })

  describe('Demo Data Validation', () => {
    test('demo expenses exist', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()

      expect(data.length).toBeGreaterThan(0)
    })

    test('demo expenses cover multiple categories', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()

      const categories = new Set(data.map((e: { category: string }) => e.category))
      expect(categories.size).toBeGreaterThan(3)
    })

    test('demo expenses have mixed statuses', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()

      const statuses = new Set(data.map((e: { status: string }) => e.status))
      expect(statuses.size).toBeGreaterThan(1)
    })

    test('demo expenses have valid amounts', async () => {
      const res = await fetch(API_BASE)
      const data = await res.json()

      for (const expense of data) {
        expect(expense.amount).toBeGreaterThan(0)
        expect(expense.amount).toBeLessThan(1000000) // Reasonable max
      }
    })
  })
})
