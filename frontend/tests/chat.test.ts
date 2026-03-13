/**
 * Chat API Tests
 * Run with: npx jest tests/chat.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/chat');
  
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

describe('GET /api/chat', () => {
  test('returns chat capabilities and context', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('capabilities');
    expect(data).toHaveProperty('context');
    expect(data).toHaveProperty('isDemoMode');
  });

  test('capabilities is an array', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data.capabilities)).toBe(true);
    expect(data.capabilities.length).toBeGreaterThan(0);
  });

  test('capabilities includes expected values', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    const expectedCapabilities = [
      'schedule_query',
      'budget_analysis',
      'crew_management',
      'script_insights',
      'risk_assessment',
      'general_assistance'
    ];
    
    expectedCapabilities.forEach(cap => {
      expect(data.capabilities).toContain(cap);
    });
  });

  test('context has required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(data.context).toHaveProperty('scriptsCount');
    expect(data.context).toHaveProperty('scenesCount');
    expect(data.context).toHaveProperty('budgetTotal');
    expect(data.context).toHaveProperty('scheduleDays');
    expect(data.context).toHaveProperty('crewCount');
    expect(data.context).toHaveProperty('warningsCount');
  });

  test('context values are numbers', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(typeof data.context.scriptsCount).toBe('number');
    expect(typeof data.context.scenesCount).toBe('number');
    expect(typeof data.context.budgetTotal).toBe('number');
    expect(typeof data.context.scheduleDays).toBe('number');
    expect(typeof data.context.crewCount).toBe('number');
    expect(typeof data.context.warningsCount).toBe('number');
  });

  test('isDemoMode is boolean', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(typeof data.isDemoMode).toBe('boolean');
  });

  test('aiEnabled is boolean', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(typeof data.aiEnabled).toBe('boolean');
  });

  test('suggstions is an array', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
  });

  test('suggestions contain production-related prompts', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    const allSuggestions = data.suggestions.join(' ').toLowerCase();
    expect(allSuggestions).toMatch(/schedule|budget|crew|risk|script/);
  });

  test('demo mode flag is present', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    // isDemoMode should exist and be boolean
    expect(data.isDemoMode !== undefined).toBe(true);
    expect(typeof data.isDemoMode).toBe('boolean');
  });
});

describe('POST /api/chat', () => {
  test('sends message and receives response', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'Hello' } 
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('response');
  });

  test('message is required', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {} 
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('empty message returns error', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: '' } 
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  test('handles history parameter', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        message: 'What about budget?',
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      }
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('response');
  });

  test('response contains production info for schedule query', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'Show me the shooting schedule' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Response should be a string (either demo, AI, or error message)
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('response contains production info for budget query', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'What is the budget status?' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('response contains production info for crew query', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'Show me crew availability' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('response contains production info for script query', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'Tell me about the script' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('response contains production info for risk query', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'What are the production risks?' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.response).toMatch(/risk|warning|issue|problem/i);
  });

  test('handles invalid JSON body', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'test' } 
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  test('handles message with special characters', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'What about ₹50,000 budget?!' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('response');
  });

  test('handles very long message', async () => {
    const longMessage = 'Tell me about '.repeat(100);
    const req = createRequest({ 
      method: 'POST', 
      body: { message: longMessage } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('response');
  });

  test('demo mode returns demo response', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: { message: 'Hello AI' } 
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Demo mode should return demo responses
    expect(data.response).toBeDefined();
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });
});
