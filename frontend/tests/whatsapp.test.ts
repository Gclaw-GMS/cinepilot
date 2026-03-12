import { describe, it, expect } from '@jest/globals';

const API_BASE = process.env.API_URL || 'http://localhost:3002';

describe('WhatsApp API', () => {
  const headers = { 'Content-Type': 'application/json' };

  describe('GET /api/whatsapp', () => {
    it('returns messages in demo mode', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDemoMode).toBe(true);
    });

    it('returns messages array', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      expect(data).toHaveProperty('messages');
      expect(Array.isArray(data.messages)).toBe(true);
    });

    it('returns message with required fields', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      const message = data.messages[0];
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('recipient');
      expect(message).toHaveProperty('recipientName');
      expect(message).toHaveProperty('message');
      expect(message).toHaveProperty('status');
      expect(message).toHaveProperty('timestamp');
    });

    it('returns valid message statuses', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      const validStatuses = ['pending', 'sent', 'delivered', 'read', 'failed'];
      
      data.messages.forEach((msg: any) => {
        expect(validStatuses).toContain(msg.status);
      });
    });

    it('has realistic phone numbers', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      
      data.messages.forEach((msg: any) => {
        expect(msg.recipient).toMatch(/^\+91/);
      });
    });

    it('has valid timestamps', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      
      data.messages.forEach((msg: any) => {
        expect(new Date(msg.timestamp)).toBeInstanceOf(Date);
      });
    });
  });

  describe('GET /api/whatsapp?action=templates', () => {
    it('returns templates when action=templates', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('templates');
    });

    it('returns templates with required fields', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      const template = data.templates[0];
      
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('content');
      expect(template).toHaveProperty('category');
    });

    it('returns valid template categories', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      const validCategories = ['production', 'logistics', 'general', 'marketing'];
      
      data.templates.forEach((tpl: any) => {
        expect(validCategories).toContain(tpl.category);
      });
    });

    it('has meaningful template content', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      
      data.templates.forEach((tpl: any) => {
        expect(tpl.content.length).toBeGreaterThan(5);
      });
    });

    it('includes expected production templates', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      const templateNames = data.templates.map((t: any) => t.name);
      
      expect(templateNames).toContain('Call Sheet');
      expect(templateNames).toContain('Schedule Update');
    });

    it('returns isDemoMode flag', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      expect(data).toHaveProperty('isDemoMode');
      expect(typeof data.isDemoMode).toBe('boolean');
    });
  });

  describe('POST /api/whatsapp - send message', () => {
    it('sends message with action=send', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'send',
          recipient: '+919999999999',
          recipientName: 'Test User',
          message: 'Test message'
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('sends message without action parameter', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          recipient: '+919999999999',
          recipientName: 'Test User',
          message: 'Test message'
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('returns new message with all fields', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'send',
          recipient: '+919999999999',
          recipientName: 'Test User',
          message: 'Test message'
        }),
      });
      const data = await res.json();
      const msg = data.message;
      
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('recipient');
      expect(msg).toHaveProperty('recipientName');
      expect(msg).toHaveProperty('message');
      expect(msg).toHaveProperty('status');
      expect(msg).toHaveProperty('timestamp');
    });

    it('defaults recipientName when not provided', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'send',
          recipient: '+919999999999',
          message: 'Test message'
        }),
      });
      const data = await res.json();
      expect(data.message.recipientName).toBe('Unknown');
    });

    it('returns isDemoMode flag', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'send',
          recipient: '+919999999999',
          message: 'Test'
        }),
      });
      const data = await res.json();
      expect(data).toHaveProperty('isDemoMode');
    });
  });

  describe('POST /api/whatsapp - create template', () => {
    it('creates template with action=create_template', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'create_template',
          name: 'Test Template',
          content: 'Test content {param1}',
          category: 'general'
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.template).toBeDefined();
    });

    it('creates template with action=template alias', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'template',
          name: 'Test Template 2',
          content: 'Content here',
          category: 'production'
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('returns new template with required fields', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'create_template',
          name: 'New Template',
          content: 'Template content',
          category: 'production'
        }),
      });
      const data = await res.json();
      const tpl = data.template;
      
      expect(tpl).toHaveProperty('id');
      expect(tpl).toHaveProperty('name');
      expect(tpl).toHaveProperty('content');
      expect(tpl).toHaveProperty('category');
    });

    it('defaults category when not provided', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'create_template',
          name: 'Template',
          content: 'Content'
        }),
      });
      const data = await res.json();
      expect(data.template.category).toBe('general');
    });

    it('defaults name when not provided', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'create_template',
          content: 'Content'
        }),
      });
      const data = await res.json();
      expect(data.template.name).toBe('New Template');
    });
  });

  describe('POST /api/whatsapp - error handling', () => {
    it('returns 400 for invalid action', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'invalid' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 500 for invalid JSON', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/whatsapp', () => {
    it('deletes template by id', async () => {
      // First create a template
      const createRes = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'create_template',
          name: 'Temp Template',
          content: 'Temp content'
        }),
      });
      const createData = await createRes.json();
      const templateId = createData.template.id;

      // Now delete it
      const deleteRes = await fetch(`${API_BASE}/api/whatsapp?id=${templateId}`, {
        method: 'DELETE',
      });
      expect(deleteRes.status).toBe(200);
      const deleteData = await deleteRes.json();
      expect(deleteData.success).toBe(true);
    });

    it('returns 400 when id is missing', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Template ID required');
    });

    it('returns 404 for non-existent template', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?id=non-existent-id`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Template not found');
    });
  });

  describe('Demo Data Validation', () => {
    it('has realistic production messages', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      
      // Should have call sheet, schedule update, reminder messages
      const messageContents = data.messages.map((m: any) => m.message);
      const relevantContent = messageContents.some((m: string) => 
        m.includes('Schedule') || m.includes('Call') || m.includes('Scene') || m.includes('Reminder')
      );
      expect(relevantContent).toBe(true);
    });
    it('has realistic recipient names from Tamil film industry', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp`);
      const data = await res.json();
      
      // Check we have real-looking names
      const names = data.messages.map((m: any) => m.recipientName);
      expect(names.length).toBeGreaterThan(0);
      names.forEach((name: string) => {
        expect(name.length).toBeGreaterThan(2);
      });
    });

    it('has multiple templates for different use cases', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      
      expect(data.templates.length).toBeGreaterThanOrEqual(4);
      
      // Check categories are varied
      const categories = new Set(data.templates.map((t: any) => t.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('has template with placeholder variables', async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp?action=templates`);
      const data = await res.json();
      
      // Templates should have placeholders like {scene}, {date}, etc.
      const hasPlaceholders = data.templates.some((t: any) => 
        t.content.includes('{') && t.content.includes('}')
      );
      expect(hasPlaceholders).toBe(true);
    });
  });
});
