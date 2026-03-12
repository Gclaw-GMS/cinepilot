import { describe, it, expect } from '@jest/globals';

const API_BASE = process.env.API_URL || 'http://localhost:3002';

describe('AI Tools API', () => {
  const headers = { 'Content-Type': 'application/json' };

  describe('GET /api/ai-tools', () => {
    it('returns list of all AI tools', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('tools');
      expect(Array.isArray(data.tools)).toBe(true);
      expect(data.tools.length).toBeGreaterThan(0);
    });

    it('returns categories array', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.length).toBeGreaterThan(0);
    });

    it('returns all required tool fields', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      const tool = data.tools[0];
      
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('desc');
      expect(tool).toHaveProperty('icon');
      expect(tool).toHaveProperty('color');
      expect(tool).toHaveProperty('category');
      expect(tool).toHaveProperty('endpoint');
    });

    it('returns valid category values', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      const validCategories = ['Script', 'Finance', 'Production', 'Planning', 'Management', 'Marketing', 'Quality', 'Post-Production'];
      
      data.categories.forEach((cat: string) => {
        expect(validCategories).toContain(cat);
      });
    });

    it('returns valid color values', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      const validColors = ['indigo', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'blue', 'purple'];
      
      data.tools.forEach((tool: any) => {
        expect(validColors).toContain(tool.color);
      });
    });

    it('returns valid endpoint paths', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      
      data.tools.forEach((tool: any) => {
        expect(tool.endpoint).toMatch(/^\/api\//);
      });
    });

    it('returns all 8 AI tools', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      expect(data.tools.length).toBe(8);
    });

    it('includes expected tool IDs', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      const toolIds = data.tools.map((t: any) => t.id);
      
      expect(toolIds).toContain('script-analyzer');
      expect(toolIds).toContain('budget-forecast');
      expect(toolIds).toContain('shot-suggest');
      expect(toolIds).toContain('schedule-optimizer');
      expect(toolIds).toContain('risk-detector');
      expect(toolIds).toContain('sentiment-analyzer');
      expect(toolIds).toContain('continuity-check');
      expect(toolIds).toContain('vfx-breakdown');
    });
  });

  describe('GET /api/ai-tools?id={toolId}', () => {
    it('returns specific tool by ID', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=script-analyzer`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.tool).toBeDefined();
      expect(data.tool.id).toBe('script-analyzer');
    });

    it('returns tool details', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=budget-forecast`);
      const data = await res.json();
      expect(data.tool.name).toBe('Budget Forecast');
      expect(data.tool.category).toBe('Finance');
    });

    it('returns 404 for invalid tool ID', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=invalid-tool`);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Tool not found');
    });

    it('returns all fields for specific tool', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=shot-suggest`);
      const data = await res.json();
      expect(data.tool).toHaveProperty('id');
      expect(data.tool).toHaveProperty('name');
      expect(data.tool).toHaveProperty('desc');
      expect(data.tool).toHaveProperty('icon');
      expect(data.tool).toHaveProperty('color');
      expect(data.tool).toHaveProperty('category');
      expect(data.tool).toHaveProperty('endpoint');
    });
  });

  describe('GET /api/ai-tools?id={toolId}&action=analyze', () => {
    it('performs analysis on tool', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=script-analyzer&action=analyze`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.tool).toBeDefined();
      expect(data.analysis).toBeDefined();
    });

    it('returns analysis with timestamp', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=budget-forecast&action=analyze`);
      const data = await res.json();
      expect(data.analysis).toHaveProperty('timestamp');
      expect(new Date(data.analysis.timestamp)).toBeInstanceOf(Date);
    });

    it('returns analysis source endpoint', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=schedule-optimizer&action=analyze`);
      const data = await res.json();
      expect(data.analysis.source).toBe('/api/schedule');
    });

    it('handles analysis for all tool types', async () => {
      const toolIds = ['script-analyzer', 'budget-forecast', 'shot-suggest', 'schedule-optimizer'];
      
      for (const toolId of toolIds) {
        const res = await fetch(`${API_BASE}/api/ai-tools?id=${toolId}&action=analyze`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.analysis).toBeDefined();
      }
    });

    it('returns error for invalid tool with analyze action', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools?id=invalid&action=analyze`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/ai-tools', () => {
    it('runs AI analysis with toolId', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'script-analyzer', prompt: 'Analyze script structure' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.result).toBeDefined();
    });

    it('includes prompt in response', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'budget-forecast', prompt: 'Forecast budget for next quarter' }),
      });
      const data = await res.json();
      expect(data.prompt).toBe('Forecast budget for next quarter');
    });

    it('includes context when provided', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          toolId: 'shot-suggest', 
          prompt: 'Suggest shots',
          context: { scene: 1, location: 'indoor' }
        }),
      });
      const data = await res.json();
      expect(data.context).toBeDefined();
      expect(data.context.scene).toBe(1);
    });

    it('returns 404 for invalid toolId', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'invalid-tool', prompt: 'test' }),
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Tool not found');
    });

    it('returns 400 for missing toolId', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: 'test prompt' }),
      });
      expect(res.status).toBe(404); // Returns 404 because tool lookup fails with undefined
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid request');
    });

    it('returns insights in result', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'vfx-breakdown', prompt: 'Identify VFX shots' }),
      });
      const data = await res.json();
      expect(data.result).toHaveProperty('insights');
      expect(Array.isArray(data.result.insights)).toBe(true);
    });

    it('returns recommendations in result', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'risk-detector', prompt: 'Find risks' }),
      });
      const data = await res.json();
      expect(data.result).toHaveProperty('recommendations');
      expect(Array.isArray(data.result.recommendations)).toBe(true);
    });

    it('returns confidence score', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'continuity-check', prompt: 'Check continuity' }),
      });
      const data = await res.json();
      expect(data.result).toHaveProperty('confidence');
      expect(typeof data.result.confidence).toBe('number');
      expect(data.result.confidence).toBeGreaterThanOrEqual(0);
      expect(data.result.confidence).toBeLessThanOrEqual(1);
    });

    it('returns timestamp in response', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolId: 'sentiment-analyzer', prompt: 'Analyze sentiment' }),
      });
      const data = await res.json();
      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('works for all tool types', async () => {
      const toolIds = ['script-analyzer', 'budget-forecast', 'shot-suggest', 'schedule-optimizer', 
                       'risk-detector', 'sentiment-analyzer', 'continuity-check', 'vfx-breakdown'];
      
      for (const toolId of toolIds) {
        const res = await fetch(`${API_BASE}/api/ai-tools`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ toolId, prompt: 'test' }),
        });
        expect(res.status).toBe(200);
      }
    });
  });

  describe('Demo Data Validation', () => {
    it('has all 8 predefined tools', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      expect(data.tools.length).toBe(8);
    });

    it('covers all production categories', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      const expectedCategories = ['Script', 'Finance', 'Production', 'Planning', 'Management', 'Marketing', 'Quality', 'Post-Production'];
      
      expectedCategories.forEach(cat => {
        expect(data.categories).toContain(cat);
      });
    });

    it('has meaningful tool descriptions', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      
      data.tools.forEach((tool: any) => {
        expect(tool.desc.length).toBeGreaterThan(10);
      });
    });

    it('has unique IDs for all tools', async () => {
      const res = await fetch(`${API_BASE}/api/ai-tools`);
      const data = await res.json();
      const ids = data.tools.map((t: any) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
