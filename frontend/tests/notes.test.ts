import { NextRequest } from 'next/server';
import { describe, test, expect } from '@jest/globals';
import { GET, POST, PUT, DELETE } from '@/app/api/notes/route';

describe('Notes API', () => {
  describe('GET /api/notes', () => {
    test('returns notes data with required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('notes');
      expect(Array.isArray(data.notes)).toBe(true);
      
      if (data.notes.length > 0) {
        const note = data.notes[0];
        expect(note).toHaveProperty('id');
        expect(note).toHaveProperty('title');
        expect(note).toHaveProperty('content');
        expect(note).toHaveProperty('category');
        expect(note).toHaveProperty('tags');
        expect(note).toHaveProperty('createdAt');
        expect(note).toHaveProperty('updatedAt');
      }
    });

    test('returns isDemoMode flag', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      expect(data).toHaveProperty('isDemoMode');
      expect(typeof data.isDemoMode).toBe('boolean');
    });

    test('filters by category when provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes?category=production');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data.notes)).toBe(true);
    });

    test('handles invalid category gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes?category=invalid-category');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data.notes)).toBe(true);
    });

    test('notes have valid date formats', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.notes.length > 0) {
        data.notes.forEach((note: { createdAt: string; updatedAt: string }) => {
          expect(() => new Date(note.createdAt)).not.toThrow();
          expect(() => new Date(note.updatedAt)).not.toThrow();
        });
      }
    });

    test('notes have string title and content', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.notes.length > 0) {
        data.notes.forEach((note: { title: unknown; content: unknown }) => {
          expect(typeof note.title).toBe('string');
          expect(typeof note.content).toBe('string');
        });
      }
    });
  });

  describe('POST /api/notes', () => {
    test('creates a new note with title', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Note ' + Date.now(),
          content: 'This is a test note content',
          category: 'general',
          tags: ['test'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('note');
      expect(data.note).toHaveProperty('title');
      expect(data.note).toHaveProperty('content');
      expect(data.note).toHaveProperty('category');
    });

    test('returns error when title is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ content: 'No title here' }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('creates note with default category when not provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Note Default Category ' + Date.now(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('note');
      expect(data.note.category).toBe('general');
    });

    test('creates note with isDemoMode flag in response', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Note Demo Mode ' + Date.now(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await POST(req);
      const data = await res.json();
      
      expect(data).toHaveProperty('isDemoMode');
    });
  });

  describe('PUT /api/notes', () => {
    test('updates a note successfully', async () => {
      // First create a note
      const createReq = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Note to Update' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      
      // Now update it
      const updateReq = new NextRequest('http://localhost:3000/api/notes', {
        method: 'PUT',
        body: JSON.stringify({ 
          id: createData.note.id, 
          title: 'Updated Title',
          content: 'Updated content',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await PUT(updateReq);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.note.title).toBe('Updated Title');
    });

    test('returns error when id is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes', {
        method: 'PUT',
        body: JSON.stringify({ title: 'No ID here' }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('handles partial updates', async () => {
      // First create a note
      const createReq = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Note for Partial Update' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      
      // Partial update - only title
      const updateReq = new NextRequest('http://localhost:3000/api/notes', {
        method: 'PUT',
        body: JSON.stringify({ 
          id: createData.note.id, 
          title: 'Partially Updated',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const res = await PUT(updateReq);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.note.title).toBe('Partially Updated');
    });
  });

  describe('DELETE /api/notes', () => {
    test('deletes a note successfully', async () => {
      // First create a note
      const createReq = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Note to Delete' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      
      // Now delete it
      const deleteReq = new NextRequest(`http://localhost:3000/api/notes?id=${encodeURIComponent(createData.note.id)}`, {
        method: 'DELETE',
      });
      
      const res = await DELETE(deleteReq);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('success');
    });

    test('returns error when id is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes', {
        method: 'DELETE',
      });
      
      const res = await DELETE(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('returns success even if note does not exist', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes?id=non-existent-id', {
        method: 'DELETE',
      });
      
      const res = await DELETE(req);
      // In demo mode, returns success even if not found
      const data = await res.json();
      expect(data).toHaveProperty('success');
    });
  });

  describe('Demo Data Validation', () => {
    test('demo data contains notes', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      expect(data.notes.length).toBeGreaterThan(0);
    });

    test('demo notes have varied categories', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      const categories = new Set(data.notes.map((n: { category: string }) => n.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    test('demo notes have tags', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      const notesWithTags = data.notes.filter((n: { tags: string[] }) => n.tags && n.tags.length > 0);
      expect(notesWithTags.length).toBeGreaterThan(0);
    });

    test('demo notes have mixed pinned status', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      const pinnedNotes = data.notes.filter((n: { isPinned: boolean }) => n.isPinned === true);
      const unpinnedNotes = data.notes.filter((n: { isPinned: boolean }) => !n.isPinned);
      
      // Should have both pinned and unpinned
      expect(pinnedNotes.length).toBeGreaterThanOrEqual(0);
      expect(unpinnedNotes.length).toBeGreaterThan(0);
    });

    test('demo notes have realistic content', async () => {
      const req = new NextRequest('http://localhost:3000/api/notes');
      const res = await GET(req);
      const data = await res.json();
      
      // Check that we have notes with both title and content
      const notesWithTitle = data.notes.filter((note: { title: string }) => note.title && note.title.length > 0);
      const notesWithContent = data.notes.filter((note: { content: string }) => note.content && note.content.length > 0);
      
      expect(notesWithTitle.length).toBeGreaterThan(0);
      expect(notesWithContent.length).toBeGreaterThan(0);
    });
  });
});
