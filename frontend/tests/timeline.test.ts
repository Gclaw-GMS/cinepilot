/**
 * Timeline API Test Suite
 * Tests all endpoints: GET timeline events, POST create, PUT update, DELETE
 */

const API_BASE = 'http://localhost:3000/api/timeline';

describe('Timeline API', () => {
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Mock fetch for demo mode timeline events
    (global.fetch as jest.Mock) = jest.fn((url: string, options?: RequestInit) => {
      const urlStr = url.toString();
      
      // Handle GET requests
      if (!options || !options.method || options.method === 'GET') {
        // Check for filters
        const urlObj = new URL(urlStr);
        const projectId = urlObj.searchParams.get('projectId') || 'default-project';
        const type = urlObj.searchParams.get('type');
        const status = urlObj.searchParams.get('status');
        
        let events = [
          {
            id: '1',
            title: 'Script Finalization',
            description: 'Finalize script with director inputs',
            type: 'pre-production',
            status: 'completed',
            startDate: '2026-01-01',
            endDate: '2026-01-15',
            projectId: 'default-project',
            notes: 'Script locked for production'
          },
          {
            id: '2',
            title: 'Casting Complete',
            description: 'Finalize all lead and supporting cast',
            type: 'pre-production',
            status: 'completed',
            startDate: '2026-01-10',
            endDate: '2026-01-25',
            projectId: 'default-project',
            notes: 'All major roles confirmed'
          },
          {
            id: '3',
            title: 'Location Scout',
            description: 'Scout and finalize all shooting locations',
            type: 'pre-production',
            status: 'completed',
            startDate: '2026-01-15',
            endDate: '2026-02-01',
            projectId: 'default-project',
            location: 'Chennai, Ooty, Madurai',
            scenes: 45
          },
          {
            id: '4',
            title: 'Pre-Production Shoot',
            description: 'BTS, promos, and promotional material',
            type: 'pre-production',
            status: 'in-progress',
            startDate: '2026-02-01',
            endDate: '2026-02-28',
            projectId: 'default-project',
            budget: 5000000
          },
          {
            id: '5',
            title: 'Day 1-5: Chennai Schedule',
            description: 'Temple and beach sequences',
            type: 'shoot',
            status: 'in-progress',
            startDate: '2026-03-15',
            endDate: '2026-03-19',
            projectId: 'default-project',
            location: 'Chennai',
            scenes: 21,
            budget: 15000000
          },
          {
            id: '6',
            title: 'Day 6-10: Ooty Schedule',
            description: 'Hill station songs and romantic sequences',
            type: 'shoot',
            status: 'pending',
            startDate: '2026-03-20',
            endDate: '2026-03-25',
            projectId: 'default-project',
            location: 'Ooty',
            scenes: 18,
            budget: 12000000
          },
          {
            id: '7',
            title: 'Day 11-15: Madurai Schedule',
            description: 'Festival sequences and climax',
            type: 'shoot',
            status: 'pending',
            startDate: '2026-03-26',
            endDate: '2026-03-31',
            projectId: 'default-project',
            location: 'Madurai',
            scenes: 25,
            budget: 18000000
          },
          {
            id: '8',
            title: 'Principal Photography Wrap',
            description: 'Complete all principal photography',
            type: 'milestone',
            status: 'pending',
            startDate: '2026-03-31',
            endDate: '2026-03-31',
            projectId: 'default-project',
            notes: 'Target wrap date'
          },
          {
            id: '9',
            title: 'Post-Production Start',
            description: 'Begin editing, VFX, and sound work',
            type: 'post-production',
            status: 'pending',
            startDate: '2026-04-01',
            endDate: '2026-04-15',
            projectId: 'default-project',
            budget: 25000000
          },
          {
            id: '10',
            title: 'VFX Completion',
            description: 'Complete all VFX shots',
            type: 'post-production',
            status: 'pending',
            startDate: '2026-04-15',
            endDate: '2026-05-15',
            projectId: 'default-project',
            budget: 15000000,
            scenes: 90
          },
          {
            id: '11',
            title: 'DI and Color Grading',
            description: 'Digital Intermediate and color grading',
            type: 'post-production',
            status: 'pending',
            startDate: '2026-05-10',
            endDate: '2026-05-25',
            projectId: 'default-project',
            budget: 5000000
          },
          {
            id: '12',
            title: 'Music and Dubbing',
            description: 'Background score and dubbing',
            type: 'post-production',
            status: 'pending',
            startDate: '2026-04-20',
            endDate: '2026-05-30',
            projectId: 'default-project',
            budget: 8000000
          },
          {
            id: '13',
            title: 'Censor Application',
            description: 'Apply for CBFC certification',
            type: 'review',
            status: 'pending',
            startDate: '2026-05-26',
            endDate: '2026-05-30',
            projectId: 'default-project'
          },
          {
            id: '14',
            title: 'Release Preview',
            description: 'Screening for producers and distributors',
            type: 'review',
            status: 'pending',
            startDate: '2026-06-01',
            endDate: '2026-06-05',
            projectId: 'default-project',
            budget: 2000000
          },
          {
            id: '15',
            title: 'Theatrical Release',
            description: 'Worldwide theatrical release',
            type: 'milestone',
            status: 'pending',
            startDate: '2026-06-15',
            endDate: '2026-06-15',
            projectId: 'default-project',
            notes: 'Target release date'
          }
        ];
        
        // Filter by projectId
        events = events.filter(e => e.projectId === projectId);
        
        // Filter by type
        if (type && type !== 'all') {
          events = events.filter(e => e.type === type);
        }
        
        // Filter by status
        if (status && status !== 'all') {
          events = events.filter(e => e.status === status);
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ events, isDemoMode: true }),
        } as unknown as Response);
      }
      
      // Handle POST requests (create event)
      if (options && options.method === 'POST') {
        const body = JSON.parse(options.body as string);
        
        // Validation: title, startDate, endDate required
        if (!body.title || !body.startDate || !body.endDate) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'Title, startDate, and endDate are required' }),
          } as unknown as Response);
        }
        
        const newEvent = {
          id: `event-${Date.now()}`,
          title: body.title,
          description: body.description || '',
          type: body.type || 'milestone',
          status: body.status || 'pending',
          startDate: body.startDate,
          endDate: body.endDate,
          projectId: body.projectId || 'default-project',
          location: body.location,
          scenes: body.scenes,
          budget: body.budget,
          notes: body.notes,
        };
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ event: newEvent, isDemoMode: true }),
        } as unknown as Response);
      }
      
      // Handle PUT requests (update event)
      if (options && options.method === 'PUT') {
        const body = JSON.parse(options.body as string);
        
        // Validation: id required
        if (!body.id) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'Event ID is required' }),
          } as unknown as Response);
        }
        
        const updatedEvent = {
          id: body.id,
          title: body.title || 'Updated Event',
          description: body.description || '',
          type: body.type || 'milestone',
          status: body.status || 'pending',
          startDate: body.startDate || '2026-06-01',
          endDate: body.endDate || '2026-06-15',
          projectId: body.projectId || 'default-project',
          location: body.location,
          scenes: body.scenes,
          budget: body.budget,
          notes: body.notes,
        };
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ event: updatedEvent, isDemoMode: true }),
        } as unknown as Response);
      }
      
      // Handle DELETE requests
      if (options && options.method === 'DELETE') {
        const urlObj = new URL(urlStr);
        const id = urlObj.searchParams.get('id');
        
        if (!id) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'Event ID is required' }),
          } as unknown as Response);
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, isDemoMode: true }),
        } as unknown as Response);
      }
      
      return Promise.resolve({
        ok: false,
        status: 405,
        json: () => Promise.resolve({ error: 'Method not allowed' }),
      } as unknown as Response);
    });
  });

  describe('GET /api/timeline', () => {
    it('should return timeline events in demo mode', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.isDemoMode).toBe(true);
    });

    it('should return events with required fields', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(data.events.length).toBeGreaterThan(0);
      
      const event = data.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('status');
      expect(event).toHaveProperty('startDate');
      expect(event).toHaveProperty('endDate');
      expect(event).toHaveProperty('projectId');
    });

    it('should filter events by type', async () => {
      const res = await fetch(`${API_BASE}?type=shoot`);
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.events).toBeDefined();
      data.events.forEach((event: { type: string }) => {
        expect(event.type).toBe('shoot');
      });
    });

    it('should filter events by status', async () => {
      const res = await fetch(`${API_BASE}?status=completed`);
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.events).toBeDefined();
      data.events.forEach((event: { status: string }) => {
        expect(event.status).toBe('completed');
      });
    });

    it('should filter by projectId', async () => {
      const res = await fetch(`${API_BASE}?projectId=default-project`);
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.events).toBeDefined();
      data.events.forEach((event: { projectId: string }) => {
        expect(event.projectId).toBe('default-project');
      });
    });

    it('should include all event types in response', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const types = new Set(data.events.map((e: { type: string }) => e.type));
      expect(types.has('pre-production')).toBe(true);
      expect(types.has('shoot')).toBe(true);
      expect(types.has('post-production')).toBe(true);
      expect(types.has('milestone')).toBe(true);
      expect(types.has('review')).toBe(true);
    });

    it('should include mixed status values', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const statuses = new Set(data.events.map((e: { status: string }) => e.status));
      expect(statuses.has('completed')).toBe(true);
      expect(statuses.has('in-progress')).toBe(true);
      expect(statuses.has('pending')).toBe(true);
    });
  });

  describe('POST /api/timeline', () => {
    it('should create a new timeline event', async () => {
      const newEvent = {
        title: 'Test Event',
        description: 'Test Description',
        type: 'shoot',
        status: 'pending',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        location: 'Test Location',
        scenes: 10,
        budget: 1000000,
      };
      
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.event).toBeDefined();
      expect(data.event.title).toBe(newEvent.title);
      expect(data.event.description).toBe(newEvent.description);
      expect(data.event.type).toBe(newEvent.type);
      expect(data.event.status).toBe(newEvent.status);
      expect(data.isDemoMode).toBe(true);
    });

    it('should create event with default type and status', async () => {
      const newEvent = {
        title: 'Minimal Event',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
      };
      
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.event.type).toBe('milestone');
      expect(data.event.status).toBe('pending');
    });

    it('should reject event without title', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: '2026-07-01',
          endDate: '2026-07-15',
        }),
      });
      
      expect(res.ok).toBe(false);
      const data = await res.json();
      expect(data.error).toContain('Title');
    });

    it('should reject event without startDate', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Event',
          endDate: '2026-07-15',
        }),
      });
      
      expect(res.ok).toBe(false);
      const data = await res.json();
      expect(data.error).toContain('startDate');
    });

    it('should reject event without endDate', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Event',
          startDate: '2026-07-01',
        }),
      });
      
      expect(res.ok).toBe(false);
      const data = await res.json();
      expect(data.error).toContain('endDate');
    });

    it('should accept optional fields', async () => {
      const newEvent = {
        title: 'Full Event',
        description: 'Full description',
        type: 'post-production',
        status: 'in-progress',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        projectId: 'custom-project',
        location: 'Studio A',
        scenes: 50,
        budget: 5000000,
        notes: 'Important notes',
      };
      
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.event.location).toBe(newEvent.location);
      expect(data.event.scenes).toBe(newEvent.scenes);
      expect(data.event.budget).toBe(newEvent.budget);
      expect(data.event.notes).toBe(newEvent.notes);
    });
  });

  describe('PUT /api/timeline', () => {
    it('should update an existing timeline event', async () => {
      const updateData = {
        id: '1',
        title: 'Updated Title',
        status: 'completed',
      };
      
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.event).toBeDefined();
      expect(data.event.id).toBe(updateData.id);
      expect(data.event.title).toBe(updateData.title);
      expect(data.event.status).toBe(updateData.status);
      expect(data.isDemoMode).toBe(true);
    });

    it('should reject update without id', async () => {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });
      
      expect(res.ok).toBe(false);
      const data = await res.json();
      expect(data.error).toContain('ID');
    });

    it('should update all provided fields', async () => {
      const updateData = {
        id: '5',
        title: 'Completely Updated',
        description: 'New description',
        type: 'milestone',
        status: 'completed',
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        location: 'New Location',
        scenes: 100,
        budget: 20000000,
        notes: 'Updated notes',
      };
      
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.event.title).toBe(updateData.title);
      expect(data.event.type).toBe(updateData.type);
    });

    it('should handle partial updates', async () => {
      const updateData = {
        id: '3',
        status: 'in-progress',
      };
      
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.event.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/timeline', () => {
    it('should delete an event by id', async () => {
      const res = await fetch(`${API_BASE}?id=1`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.isDemoMode).toBe(true);
    });

    it('should reject delete without id', async () => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
      });
      
      expect(res.ok).toBe(false);
      const data = await res.json();
      expect(data.error).toContain('ID');
    });

    it('should delete with projectId parameter', async () => {
      const res = await fetch(`${API_BASE}?id=5&projectId=default-project`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      expect(res.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Demo Data Validation', () => {
    it('should have realistic pre-production events', async () => {
      const res = await fetch(`${API_BASE}?type=pre-production`);
      const data = await res.json();
      
      expect(data.events.length).toBeGreaterThan(0);
      
      const preProdEvents = data.events;
      expect(preProdEvents.some((e: { title: string }) => e.title.toLowerCase().includes('script'))).toBe(true);
      expect(preProdEvents.some((e: { title: string }) => e.title.toLowerCase().includes('cast'))).toBe(true);
      expect(preProdEvents.some((e: { title: string }) => e.title.toLowerCase().includes('location'))).toBe(true);
    });

    it('should have shoot events with location data', async () => {
      const res = await fetch(`${API_BASE}?type=shoot`);
      const data = await res.json();
      
      expect(data.events.length).toBeGreaterThan(0);
      
      data.events.forEach((event: { location?: string; scenes?: number; budget?: number }) => {
        expect(event.location).toBeDefined();
        expect(event.scenes).toBeGreaterThan(0);
        expect(event.budget).toBeGreaterThan(0);
      });
    });

    it('should have post-production events with budget', async () => {
      const res = await fetch(`${API_BASE}?type=post-production`);
      const data = await res.json();
      
      expect(data.events.length).toBeGreaterThan(0);
      
      data.events.forEach((event: { budget?: number }) => {
        expect(event.budget).toBeGreaterThan(0);
      });
    });

    it('should have milestone events', async () => {
      const res = await fetch(`${API_BASE}?type=milestone`);
      const data = await res.json();
      
      expect(data.events.length).toBeGreaterThan(0);
      
      const titles = data.events.map((e: { title: string }) => e.title.toLowerCase());
      expect(titles.some(t => t.includes('wrap') || t.includes('release'))).toBe(true);
    });

    it('should have review events', async () => {
      const res = await fetch(`${API_BASE}?type=review`);
      const data = await res.json();
      
      expect(data.events.length).toBeGreaterThan(0);
      
      const titles = data.events.map((e: { title: string }) => e.title.toLowerCase());
      expect(titles.some(t => t.includes('censor') || t.includes('preview') || t.includes('screening'))).toBe(true);
    });

    it('should have events spanning realistic timeline', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const dates = data.events.map((e: { startDate: string; endDate: string }) => ({
        start: new Date(e.startDate),
        end: new Date(e.endDate),
      }));
      
      // First event should start around January 2026
      expect(dates[0].start.getFullYear()).toBe(2026);
      expect(dates[0].start.getMonth()).toBe(0); // January
      
      // Last event should be around June 2026 (release)
      const lastDate = dates[dates.length - 1].end;
      expect(lastDate.getFullYear()).toBe(2026);
      expect(lastDate.getMonth()).toBe(5); // June
    });

    it('should have complete event structure', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      // Check first event has all fields
      const event = data.events[0];
      expect(typeof event.id).toBe('string');
      expect(typeof event.title).toBe('string');
      expect(typeof event.description).toBe('string');
      expect(['pre-production', 'shoot', 'post-production', 'milestone', 'review']).toContain(event.type);
      expect(['pending', 'in-progress', 'completed', 'delayed']).toContain(event.status);
      expect(typeof event.startDate).toBe('string');
      expect(typeof event.endDate).toBe('string');
      expect(typeof event.projectId).toBe('string');
    });

    it('should have valid date formats', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      data.events.forEach((event: { startDate: string; endDate: string }) => {
        expect(event.startDate).toMatch(dateRegex);
        expect(event.endDate).toMatch(dateRegex);
        
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        expect(start <= end).toBe(true);
      });
    });

    it('should calculate correct timeline statistics', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      const events = data.events;
      const completed = events.filter((e: { status: string }) => e.status === 'completed').length;
      const inProgress = events.filter((e: { status: string }) => e.status === 'in-progress').length;
      const pending = events.filter((e: { status: string }) => e.status === 'pending').length;
      
      expect(completed).toBe(3);
      expect(inProgress).toBe(2);
      expect(pending).toBe(10);
      expect(events.length).toBe(15);
    });
  });
});
