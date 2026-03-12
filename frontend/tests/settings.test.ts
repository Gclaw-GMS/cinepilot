import { describe, it, expect, beforeAll } from '@jest/globals';

const API_BASE = process.env.API_URL || 'http://localhost:3002';

describe('Settings API', () => {
  const headers = { 'Content-Type': 'application/json' };

  describe('GET /api/settings', () => {
    it('returns settings in demo mode when DB not available', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDemoMode).toBe(true);
    });

    it('returns required settings fields', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      
      // Core settings
      expect(data).toHaveProperty('theme');
      expect(data).toHaveProperty('language');
      expect(data).toHaveProperty('timezone');
      expect(data).toHaveProperty('currency');
      expect(data).toHaveProperty('dateFormat');
      
      // Nested settings
      expect(data).toHaveProperty('notifications');
      expect(data.notifications).toHaveProperty('email');
      expect(data.notifications).toHaveProperty('push');
      expect(data.notifications).toHaveProperty('sms');
      
      expect(data).toHaveProperty('production');
      expect(data.production).toHaveProperty('defaultQuality');
      expect(data.production).toHaveProperty('defaultFrameRate');
      expect(data.production).toHaveProperty('defaultResolution');
      
      expect(data).toHaveProperty('api');
      expect(data.api).toHaveProperty('aiProvider');
      expect(data.api).toHaveProperty('weatherProvider');
      
      expect(data).toHaveProperty('display');
      expect(data.display).toHaveProperty('dashboardLayout');
      expect(data.display).toHaveProperty('showStats');
      expect(data.display).toHaveProperty('compactMode');
      
      // Demo mode flag
      expect(data).toHaveProperty('isDemoMode');
    });

    it('returns valid theme values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      expect(['light', 'dark', 'auto']).toContain(data.theme);
    });

    it('returns valid language codes', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      const validLanguages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'ja', 'ko', 'zh'];
      expect(validLanguages).toContain(data.language);
    });

    it('returns valid currency codes', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];
      expect(validCurrencies).toContain(data.currency);
    });

    it('returns boolean notification values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      expect(typeof data.notifications.email).toBe('boolean');
      expect(typeof data.notifications.push).toBe('boolean');
      expect(typeof data.notifications.sms).toBe('boolean');
    });

    it('returns valid production quality values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      const validQualities = ['480p', '720p', '1080p', '2K', '4K', '8K'];
      expect(validQualities).toContain(data.production.defaultQuality);
    });

    it('returns valid frame rate values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      const validRates = ['24fps', '25fps', '30fps', '48fps', '60fps'];
      expect(validRates).toContain(data.production.defaultFrameRate);
    });

    it('returns valid display layout values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      const validLayouts = ['grid', 'list', 'compact'];
      expect(validLayouts).toContain(data.display.dashboardLayout);
    });

    it('returns boolean display values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      expect(typeof data.display.showStats).toBe('boolean');
      expect(typeof data.display.compactMode).toBe('boolean');
    });

    it('returns valid AI provider values', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      const validProviders = ['aiml', 'openai', 'anthropic', 'google'];
      expect(validProviders).toContain(data.api.aiProvider);
    });
  });

  describe('POST /api/settings', () => {
    it('updates a single setting in demo mode', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: 'theme', value: 'light' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isDemoMode).toBe(true);
    });

    it('updates nested setting in demo mode', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: 'notifications.email', value: false }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('bulk updates settings in demo mode', async () => {
      const newSettings = {
        theme: 'dark',
        language: 'ta',
        notifications: { email: true, push: false, sms: true },
      };
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'bulk', settings: newSettings }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('returns 400 when key is missing', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ value: 'test' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 when key is empty', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: '', value: 'test' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 for bulk with invalid settings type', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'bulk', settings: 'invalid' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('settings must be');
    });

    it('returns 400 for bulk with array settings', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'bulk', settings: ['a', 'b', 'c'] }),
      });
      expect(res.status).toBe(400);
    });

    it('handles invalid JSON body gracefully', async () => {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ invalid: 'json' }),
      });
      // Should still work as key is optional in some cases
      expect([200, 400]).toContain(res.status);
    });

    it('validates date format values', async () => {
      const formats = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
      for (const format of formats) {
        const res = await fetch(`${API_BASE}/api/settings`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ key: 'dateFormat', value: format }),
        });
        expect(res.status).toBe(200);
      }
    });

    it('validates timezone values', async () => {
      const timezones = ['Asia/Kolkata', 'Asia/Tokyo', 'Europe/London', 'America/New_York'];
      for (const tz of timezones) {
        const res = await fetch(`${API_BASE}/api/settings`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ key: 'timezone', value: tz }),
        });
        expect(res.status).toBe(200);
      }
    });
  });

  describe('Demo Data Validation', () => {
    it('has complete demo settings structure', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      
      // Verify complete structure
      expect(Object.keys(data)).toContain('theme');
      expect(Object.keys(data)).toContain('language');
      expect(Object.keys(data)).toContain('timezone');
      expect(Object.keys(data)).toContain('currency');
      expect(Object.keys(data)).toContain('dateFormat');
      expect(Object.keys(data)).toContain('notifications');
      expect(Object.keys(data)).toContain('production');
      expect(Object.keys(data)).toContain('api');
      expect(Object.keys(data)).toContain('display');
    });

    it('has realistic default values', async () => {
      // First reset to defaults to ensure clean state
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          action: 'bulk', 
          settings: {
            theme: 'dark',
            language: 'en',
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            dateFormat: 'DD-MM-YYYY',
          }
        }),
      });
      
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      
      // Tamil cinema defaults - check values are valid
      expect(['en', 'ta', 'hi', 'te']).toContain(data.language);
      expect(data.currency).toBe('INR'); // Indian Rupee
      expect(data.timezone).toBe('Asia/Kolkata'); // IST
      
      // Production defaults
      expect(data.production.defaultQuality).toBe('4K');
      expect(data.production.defaultFrameRate).toBe('24fps');
    });

    it('preserves isDemoMode flag', async () => {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      expect(typeof data.isDemoMode).toBe('boolean');
    });
  });
});
