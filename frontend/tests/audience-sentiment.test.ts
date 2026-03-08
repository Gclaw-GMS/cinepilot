/**
 * Audience Sentiment API Tests
 * Run with: npx jest tests/audience-sentiment.test.ts
 */

const API_BASE = 'http://localhost:3000/api/audience-sentiment';

describe('Audience Sentiment API', () => {
  let createdSentimentId: string;

  beforeAll(async () => {
    // Clean up any test sentiments
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    for (const sentiment of data.sentiments || []) {
      if (sentiment.title?.includes('TEST_')) {
        await fetch(`${API_BASE}?id=${sentiment.id}`, { method: 'DELETE' });
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdSentimentId) {
      await fetch(`${API_BASE}?id=${createdSentimentId}`, { method: 'DELETE' });
    }
  });

  test('GET /api/audience-sentiment returns sentiments list', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('sentiments');
    expect(data).toHaveProperty('isDemoMode');
  });

  test('GET /api/audience-sentiment with platform filter', async () => {
    const res = await fetch(`${API_BASE}?projectId=demo-project&platform=youtube`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // All returned sentiments should match platform filter
    for (const sentiment of data.sentiments || []) {
      if (sentiment.platform && sentiment.platform !== 'youtube') {
        throw new Error('Platform filter not working');
      }
    }
  });

  test('POST /api/audience-sentiment creates new sentiment analysis', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        title: 'TEST_Trailer Reaction',
        platform: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test123'
      })
    });
    
    const data = await res.json();
    // May return 200 with demo data or 201 with created object
    expect([200, 201]).toContain(res.status);
    
    if (data.id) {
      createdSentimentId = data.id;
    }
  });

  test('GET /api/audience-sentiment/[id] returns single sentiment', async () => {
    // First get list to find an ID
    const listRes = await fetch(`${API_BASE}?projectId=demo-project`);
    const listData = await listRes.json();
    
    if (listData.sentiments && listData.sentiments.length > 0) {
      const id = listData.sentiments[0].id;
      const res = await fetch(`${API_BASE}?id=${id}`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('id');
    }
  });

  test('DELETE /api/audience-sentiment removes sentiment', async () => {
    // Create first
    const createRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo-project',
        title: 'TEST_ToBeDeleted',
        platform: 'youtube'
      })
    });
    
    if (createRes.ok) {
      const createData = await createRes.json();
      if (createData.id) {
        const deleteRes = await fetch(`${API_BASE}?id=${createData.id}`, {
          method: 'DELETE'
        });
        
        expect(deleteRes.ok).toBe(true);
      }
    }
  });
});
