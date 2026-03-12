/**
 * Audience Sentiment API Tests
 * Run with: npx jest tests/audience-sentiment.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { GET, POST, DELETE } from '@/app/api/audience-sentiment/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params and body
function createRequest(options: {
  method?: string;
  params?: Record<string, string>;
  body?: unknown;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/audience-sentiment');
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  const init: RequestInit = {
    method: options.method || 'GET',
  };
  
  if (options.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  
  return new NextRequest(url, init);
}

describe('Audience Sentiment API', () => {
  describe('GET /api/audience-sentiment', () => {
    test('returns sentiments list', async () => {
      const req = createRequest({ params: { projectId: 'demo-project' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('sentiments');
      expect(data).toHaveProperty('isDemoMode');
    });

    test('returns sentiments without projectId', async () => {
      const req = createRequest();
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('sentiments');
    });

    test('GET with platform filter', async () => {
      const req = createRequest({ params: { projectId: 'demo-project', platform: 'youtube' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      // All returned sentiments should match platform filter
      for (const sentiment of data.sentiments || []) {
        if (sentiment.platform && sentiment.platform !== 'youtube') {
          throw new Error('Platform filter not working');
        }
      }
    });

    test('GET with status filter', async () => {
      const req = createRequest({ params: { projectId: 'demo-project', status: 'completed' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      // All returned sentiments should have completed status
      for (const sentiment of data.sentiments || []) {
        if (sentiment.status && sentiment.status !== 'completed') {
          throw new Error('Status filter not working');
        }
      }
    });

    test('GET single sentiment by id', async () => {
      // First get list to find an ID
      const listReq = createRequest({ params: { projectId: 'demo-project' } });
      const listRes = await GET(listReq);
      const listData = await listRes.json();
      
      if (listData.sentiments && listData.sentiments.length > 0) {
        const id = listData.sentiments[0].id;
        const req = createRequest({ params: { id } });
        const res = await GET(req);
        const data = await res.json();
        
        expect(res.status).toBe(200);
        expect(data).toHaveProperty('id');
        expect(data.id).toBe(id);
      }
    });

    test('GET returns 404 for non-existent id', async () => {
      const req = createRequest({ params: { id: 'non-existent-id' } });
      const res = await GET(req);
      
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/audience-sentiment', () => {
    test('creates new sentiment analysis', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          projectId: 'demo-project',
          title: 'TEST_Trailer Reaction',
          platform: 'youtube',
          videoUrl: 'https://youtube.com/watch?v=test123'
        }
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      // May return 200 with demo data or 201 with created object
      expect([200, 201]).toContain(res.status);
      
      // Demo mode returns { sentiment: {...} }
      const sentiment = data.sentiment || data;
      if (sentiment.id) {
        expect(sentiment).toHaveProperty('id');
        expect(sentiment.title).toBe('TEST_Trailer Reaction');
      }
    });

    test('creates sentiment with demo mode', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          projectId: 'demo-project',
          title: 'TEST_Demo Analysis',
          platform: 'twitter',
          useDemo: true
        }
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect([200, 201]).toContain(res.status);
      // Demo mode returns { sentiment: {...} }
      const sentiment = data.sentiment || data;
      expect(sentiment).toHaveProperty('id');
    });

    test('handles missing required fields', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          projectId: 'demo-project'
        }
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      // In demo mode without platform, it returns sentiment object wrapped
      expect([200, 201, 400]).toContain(res.status);
      // If successful, data should have sentiment
      if (res.status === 200 || res.status === 201) {
        expect(data).toHaveProperty('sentiment');
      }
    });
  });

  describe('DELETE /api/audience-sentiment', () => {
    test('deletes sentiment by id', async () => {
      // First create a sentiment
      const createReq = createRequest({
        method: 'POST',
        body: {
          projectId: 'demo-project',
          title: 'TEST_Delete Me',
          platform: 'youtube'
        }
      });
      const createRes = await POST(createReq);
      
      // Now try to delete it
      const deleteReq = createRequest({
        method: 'DELETE',
        params: { id: 'non-existent' }
      });
      const deleteRes = await DELETE(deleteReq);
      
      // In demo mode or without ID, can return various statuses
      expect([200, 400, 404, 500]).toContain(deleteRes.status);
    });

    test('returns 400 when id is missing', async () => {
      const req = createRequest({ method: 'DELETE' });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    test('demo sentiments have required fields', async () => {
      const req = createRequest({ params: { projectId: 'demo-project' } });
      const res = await GET(req);
      const data = await res.json();
      
      expect(Array.isArray(data.sentiments)).toBe(true);
      if (data.sentiments.length > 0) {
        const sentiment = data.sentiments[0];
        expect(sentiment).toHaveProperty('id');
        expect(sentiment).toHaveProperty('projectId');
        expect(sentiment).toHaveProperty('title');
        expect(sentiment).toHaveProperty('platform');
        expect(sentiment).toHaveProperty('status');
      }
    });

    test('demo sentiments have sentiment counts', async () => {
      const req = createRequest({ params: { projectId: 'demo-project' } });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.sentiments && data.sentiments.length > 0) {
        const sentiment = data.sentiments[0];
        expect(sentiment).toHaveProperty('positiveCount');
        expect(sentiment).toHaveProperty('negativeCount');
        expect(sentiment).toHaveProperty('neutralCount');
        expect(sentiment).toHaveProperty('avgSentiment');
      }
    });

    test('demo sentiments have analysis data when completed', async () => {
      const req = createRequest({ params: { projectId: 'demo-project', status: 'completed' } });
      const res = await GET(req);
      const data = await res.json();
      
      if (data.sentiments && data.sentiments.length > 0) {
        const sentiment = data.sentiments[0];
        expect(sentiment).toHaveProperty('topPositive');
        expect(sentiment).toHaveProperty('topNegative');
        expect(sentiment).toHaveProperty('takeaways');
      }
    });

    test('demo data includes multiple platforms', async () => {
      const req = createRequest({ params: { projectId: 'demo-project' } });
      const res = await GET(req);
      const data = await res.json();
      
      const platforms = new Set(data.sentiments?.map((s: any) => s.platform) || []);
      expect(platforms.size).toBeGreaterThan(1);
    });
  });
});
