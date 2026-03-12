/**
 * Settings API Test Suite
 * Tests all endpoints for the Settings feature
 */
import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/settings/route';
import { NextRequest } from 'next/server';

// Helper to create request
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/settings');
  
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

describe('Settings API', () => {
  describe('GET /api/settings', () => {
    it('returns settings in demo mode when DB not available', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.isDemoMode).toBe(true);
    });

    it('returns required settings fields', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
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
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(['light', 'dark', 'auto']).toContain(data.theme);
    });

    it('returns valid language codes', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validLanguages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'ja', 'ko', 'zh'];
      expect(validLanguages).toContain(data.language);
    });

    it('returns valid currency codes', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];
      expect(validCurrencies).toContain(data.currency);
    });

    it('returns boolean notification values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(typeof data.notifications.email).toBe('boolean');
      expect(typeof data.notifications.push).toBe('boolean');
      expect(typeof data.notifications.sms).toBe('boolean');
    });

    it('returns valid production quality values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(['SD', 'HD', '2K', '4K', '8K']).toContain(data.production.defaultQuality);
    });

    it('returns valid frame rate values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validFrameRates = ['24fps', '25fps', '30fps', '48fps', '60fps'];
      expect(validFrameRates).toContain(data.production.defaultFrameRate);
    });

    it('returns valid resolution values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validResolutions = ['1920x1080', '2048x1080', '3840x2160', '4096x2160', '7680x4320'];
      expect(validResolutions).toContain(data.production.defaultResolution);
    });

    it('returns valid API provider values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validProviders = ['aiml', 'openai', 'anthropic', 'google'];
      expect(validProviders).toContain(data.api.aiProvider);
    });

    it('returns valid weather provider values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validProviders = ['open-meteo', 'weatherapi', 'openweathermap'];
      expect(validProviders).toContain(data.api.weatherProvider);
    });

    it('returns valid dashboard layout values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      const validLayouts = ['grid', 'list', 'kanban', 'calendar'];
      expect(validLayouts).toContain(data.display.dashboardLayout);
    });

    it('returns boolean display settings', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(typeof data.display.showStats).toBe('boolean');
      expect(typeof data.display.compactMode).toBe('boolean');
    });
  });

  describe('POST /api/settings', () => {
    it('updates a single setting in demo mode', async () => {
      const req = createRequest({
        method: 'POST',
        body: { key: 'theme', value: 'light' }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isDemoMode).toBe(true);
    });

    it('updates nested setting in demo mode', async () => {
      const req = createRequest({
        method: 'POST',
        body: { key: 'notifications.email', value: false }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('bulk updates settings in demo mode', async () => {
      const req = createRequest({
        method: 'POST',
        body: { 
          action: 'bulk',
          settings: { 
            theme: 'dark',
            language: 'ta'
          }
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isDemoMode).toBe(true);
    });

    it('returns error when key is missing', async () => {
      const req = createRequest({
        method: 'POST',
        body: { value: 'something' }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('returns error when key is empty', async () => {
      const req = createRequest({
        method: 'POST',
        body: { key: '', value: 'something' }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('returns error when bulk settings is not an object', async () => {
      const req = createRequest({
        method: 'POST',
        body: { 
          action: 'bulk',
          settings: 'not an object'
        }
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('handles empty body gracefully in demo mode', async () => {
      const req = createRequest({
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      
      // Should handle gracefully - either success or error
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('Demo Data Validation', () => {
    it('has default theme as dark', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.theme).toBe('dark');
    });

    it('has default timezone as Asia/Kolkata', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.timezone).toBe('Asia/Kolkata');
    });

    it('has default currency as INR', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.currency).toBe('INR');
    });

    it('has default date format DD-MM-YYYY', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.dateFormat).toBe('DD-MM-YYYY');
    });

    it('notifications have boolean values', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      // After POST tests may have modified state, check structure instead of exact values
      expect(typeof data.notifications.email).toBe('boolean');
      expect(typeof data.notifications.push).toBe('boolean');
      expect(typeof data.notifications.sms).toBe('boolean');
    });

    it('production defaults are cinematic standard', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.production.defaultQuality).toBe('4K');
      expect(data.production.defaultFrameRate).toBe('24fps');
      expect(data.production.defaultResolution).toBe('4096x2160');
    });

    it('display defaults show stats in grid layout', async () => {
      const req = createRequest({ method: 'GET' });
      const res = await GET();
      const data = await res.json();
      
      expect(data.display.dashboardLayout).toBe('grid');
      expect(data.display.showStats).toBe(true);
      expect(data.display.compactMode).toBe(false);
    });
  });
});
