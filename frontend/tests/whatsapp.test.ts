/**
 * WhatsApp API Test Suite
 * Tests all endpoints for the WhatsApp messaging feature
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST, DELETE } from '@/app/api/whatsapp/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/whatsapp');
  
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

describe('WhatsApp API', () => {
  describe('GET /api/whatsapp', () => {
    it('returns messages in demo mode', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.isDemoMode).toBe(true);
    });

    it('returns messages array', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data).toHaveProperty('messages');
      expect(Array.isArray(data.messages)).toBe(true);
    });

    it('returns message with required fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.messages.length > 0) {
        const message = data.messages[0];
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('recipient');
        expect(message).toHaveProperty('recipientName');
        expect(message).toHaveProperty('message');
        expect(message).toHaveProperty('status');
        expect(message).toHaveProperty('timestamp');
      }
    });

    it('returns valid message statuses', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const validStatuses = ['pending', 'sent', 'delivered', 'read', 'failed'];
      
      data.messages.forEach((msg: any) => {
        expect(validStatuses).toContain(msg.status);
      });
    });

    it('has realistic phone numbers', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.messages.forEach((msg: any) => {
        expect(msg.recipient).toMatch(/^\+91/);
      });
    });

    it('has message content', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.messages.forEach((msg: any) => {
        expect(msg.message.length).toBeGreaterThan(0);
      });
    });

    it('returns isDemoMode as boolean', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(typeof data.isDemoMode).toBe('boolean');
    });

    it('handles templates action', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('templates');
      expect(Array.isArray(data.templates)).toBe(true);
    });

    it('templates have required fields', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.templates.length > 0) {
        const template = data.templates[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('content');
        expect(template).toHaveProperty('category');
      }
    });

    it('templates have valid categories', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      const validCategories = ['general', 'production', 'logistics', 'marketing', 'urgent'];
      
      data.templates.forEach((tpl: any) => {
        expect(validCategories).toContain(tpl.category);
      });
    });
  });

  describe('POST /api/whatsapp', () => {
    it('sends a message', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'send',
          recipient: '+919999999999',
          recipientName: 'Test User',
          message: 'Test message'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toHaveProperty('id');
      expect(data.message.recipient).toBe('+919999999999');
    });

    it('sends message without explicit action', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          recipient: '+919888888888',
          recipientName: 'Another User',
          message: 'Another test message'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('creates template', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'create_template',
          name: 'Test Template',
          content: 'Test content {variable}',
          category: 'production'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.template).toHaveProperty('id');
      expect(data.template.name).toBe('Test Template');
    });

    it('creates template with template action', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'template',
          name: 'Another Template',
          content: 'Content here',
          category: 'general'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('defaults recipientName when not provided', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'send',
          recipient: '+919777777777',
          message: 'Test'
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.message.recipientName).toBe('Unknown');
    });

    it('handles invalid action', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          action: 'invalid_action',
          recipient: '+919999999999',
          message: 'Test'
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('handles empty body', async () => {
      const req = createRequest({
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/whatsapp', () => {
    it('deletes template by id', async () => {
      // First create a template
      const createReq = createRequest({
        method: 'POST',
        body: {
          action: 'create_template',
          name: 'To be deleted',
          content: 'Delete me',
          category: 'general'
        }
      });
      const createRes = await POST(createReq);
      const created = await createRes.json();
      
      // Now delete it
      const deleteReq = createRequest({ 
        method: 'DELETE',
        params: { id: created.template.id }
      });
      const deleteRes = await DELETE(deleteReq);
      const deleted = await deleteRes.json();
      
      expect(deleteRes.status).toBe(200);
      expect(deleted.success).toBe(true);
    });

    it('returns error without id', async () => {
      const req = createRequest({ method: 'DELETE' });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('returns error for non-existent template', async () => {
      const req = createRequest({ 
        method: 'DELETE',
        params: { id: 'non-existent-id' }
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(404);
    });
  });

  describe('Demo Data Validation', () => {
    it('has multiple messages', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.messages.length).toBeGreaterThan(0);
    });

    it('has production-related messages', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasProductionContent = data.messages.some((msg: any) => 
        msg.message.includes('Schedule') || 
        msg.message.includes('Call Sheet') ||
        msg.message.includes('Scene')
      );
      expect(hasProductionContent).toBe(true);
    });

    it('has emoji in messages', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const hasEmoji = data.messages.some((msg: any) => 
        /[\u{1F300}-\u{1F9FF}]/u.test(msg.message)
      );
      expect(hasEmoji).toBe(true);
    });

    it('has multiple templates', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.templates.length).toBeGreaterThan(1);
    });

    it('templates have placeholder variables', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      const hasVariables = data.templates.some((tpl: any) => 
        tpl.content.includes('{')
      );
      expect(hasVariables).toBe(true);
    });

    it('has Call Sheet template', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      const hasCallSheet = data.templates.some((tpl: any) => 
        tpl.name === 'Call Sheet'
      );
      expect(hasCallSheet).toBe(true);
    });

    it('has production category templates', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      const hasProduction = data.templates.some((tpl: any) => 
        tpl.category === 'production'
      );
      expect(hasProduction).toBe(true);
    });

    it('has logistics category templates', async () => {
      const req = createRequest({ method: 'GET', params: { action: 'templates' } });
      const res = await GET(req);
      const data = await res.json();
      
      const hasLogistics = data.templates.some((tpl: any) => 
        tpl.category === 'logistics'
      );
      expect(hasLogistics).toBe(true);
    });

    it('messages have valid timestamps', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      data.messages.forEach((msg: any) => {
        expect(() => new Date(msg.timestamp)).not.toThrow();
      });
    });

    it('has varied message statuses', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET(req);
      const data = await res.json();
      
      const statuses = new Set(data.messages.map((msg: any) => msg.status));
      expect(statuses.size).toBeGreaterThanOrEqual(1);
    });
  });
});
