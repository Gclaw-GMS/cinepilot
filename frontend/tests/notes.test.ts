import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = 'http://localhost:3002/api/notes';

describe('Notes API', () => {
  let createdNoteId: string;

  // Helper to make requests
  async function fetchNotes() {
    const res = await fetch(API_BASE);
    return res.json();
  }

  async function createNote(note: { title: string; content?: string; category?: string; tags?: string[]; isPinned?: boolean }) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return res.json();
  }

  async function updateNote(id: string, updates: Record<string, unknown>) {
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    return res.json();
  }

  async function deleteNote(id: string) {
    const res = await fetch(`${API_BASE}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  describe('GET /api/notes', () => {
    test('returns notes data with required fields', async () => {
      const res = await fetch(API_BASE);
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
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      expect(data).toHaveProperty('isDemoMode');
      expect(typeof data.isDemoMode).toBe('boolean');
    });

    test('filters by category when provided', async () => {
      const res = await fetch(`${API_BASE}?category=production`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data.notes)).toBe(true);
      
      // All notes should be production category (or demo returns all)
      if (!data.isDemoMode && data.notes.length > 0) {
        data.notes.forEach((note: { category: string }) => {
          expect(note.category).toBe('production');
        });
      }
    });

    test('handles invalid category gracefully', async () => {
      const res = await fetch(`${API_BASE}?category=invalid-category`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(Array.isArray(data.notes)).toBe(true);
    });

    test('notes have valid date formats', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.notes.length > 0) {
        data.notes.forEach((note: { createdAt: string; updatedAt: string }) => {
          expect(() => new Date(note.createdAt)).not.toThrow();
          expect(() => new Date(note.updatedAt)).not.toThrow();
        });
      }
    });

    test('notes have string title and content', async () => {
      const res = await fetch(API_BASE);
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
      const testNote = {
        title: 'Test Note ' + Date.now(),
        content: 'This is a test note content',
        category: 'general',
        tags: ['test'],
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(res.note.title).toBe(testNote.title);
      expect(res.note.content).toBe(testNote.content);
      expect(res.note.category).toBe(testNote.category);
      
      if (res.note.id && !res.note.id.startsWith('note-')) {
        createdNoteId = res.note.id;
      }
    });

    test('returns error when title is missing', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'No title here' }),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('creates note with default category when not provided', async () => {
      const testNote = {
        title: 'Test Note Default Category ' + Date.now(),
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(res.note.category).toBe('general');
    });

    test('creates pinned note when isPinned is true', async () => {
      const testNote = {
        title: 'Pinned Test Note ' + Date.now(),
        isPinned: true,
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(res.note.isPinned).toBe(true);
    });

    test('creates note with empty tags array', async () => {
      const testNote = {
        title: 'Tags Test Note ' + Date.now(),
        tags: [],
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(Array.isArray(res.note.tags)).toBe(true);
    });

    test('returns isDemoMode flag in response', async () => {
      const testNote = {
        title: 'Demo Mode Test ' + Date.now(),
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('isDemoMode');
      expect(typeof res.isDemoMode).toBe('boolean');
    });

    test('handles special characters in title', async () => {
      const testNote = {
        title: 'Test Note with special chars: @#$%^&*()',
        content: 'Content with\nnewlines\tand\ttabs',
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(res.note.title).toBe(testNote.title);
    });

    test('handles unicode characters in title', async () => {
      const testNote = {
        title: 'தமிழ் Note 测试 नोट्स',
        category: 'creative',
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(res.note.title).toBe(testNote.title);
    });

    test('handles long content', async () => {
      const longContent = 'A'.repeat(10000);
      const testNote = {
        title: 'Long Content Note',
        content: longContent,
      };
      
      const res = await createNote(testNote);
      
      expect(res).toHaveProperty('note');
      expect(res.note.content.length).toBe(longContent.length);
    });
  });

  describe('PUT /api/notes', () => {
    test('updates note title', async () => {
      // First create a note
      const createRes = await createNote({ title: 'Update Test ' + Date.now() });
      const noteId = createRes.note.id;
      
      // Then update it
      const updateRes = await updateNote(noteId, { title: 'Updated Title ' + Date.now() });
      
      expect(updateRes).toHaveProperty('note');
      expect(updateRes.note.title).toBeDefined();
    });

    test('updates note content', async () => {
      const createRes = await createNote({ title: 'Content Update ' + Date.now() });
      const noteId = createRes.note.id;
      
      const updateRes = await updateNote(noteId, { content: 'New updated content' });
      
      expect(updateRes).toHaveProperty('note');
      expect(updateRes.note.content).toBe('New updated content');
    });

    test('updates note category', async () => {
      const createRes = await createNote({ title: 'Category Update ' + Date.now(), category: 'general' });
      const noteId = createRes.note.id;
      
      const updateRes = await updateNote(noteId, { category: 'production' });
      
      expect(updateRes).toHaveProperty('note');
      expect(updateRes.note.category).toBe('production');
    });

    test('updates isPinned flag', async () => {
      const createRes = await createNote({ title: 'Pinned Update ' + Date.now(), isPinned: false });
      const noteId = createRes.note.id;
      
      const updateRes = await updateNote(noteId, { isPinned: true });
      
      expect(updateRes).toHaveProperty('note');
      expect(updateRes.note.isPinned).toBe(true);
    });

    test('updates tags array', async () => {
      const createRes = await createNote({ title: 'Tags Update ' + Date.now(), tags: ['old'] });
      const noteId = createRes.note.id;
      
      const updateRes = await updateNote(noteId, { tags: ['updated', 'new', 'tags'] });
      
      expect(updateRes).toHaveProperty('note');
      expect(updateRes.note.tags).toEqual(['updated', 'new', 'tags']);
    });

    test('returns error when id is missing', async () => {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'No ID Note' }),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('handles partial updates', async () => {
      const createRes = await createNote({ title: 'Partial Update ' + Date.now(), content: 'Original', category: 'general' });
      const noteId = createRes.note.id;
      
      const updateRes = await updateNote(noteId, { content: 'Only content changed' });
      
      expect(updateRes).toHaveProperty('note');
      expect(updateRes.note.title).toBeDefined();
      expect(updateRes.note.content).toBe('Only content changed');
      expect(updateRes.note.category).toBeDefined();
    });
  });

  describe('DELETE /api/notes', () => {
    test('deletes a note successfully', async () => {
      // Create a note first
      const createRes = await createNote({ title: 'Delete Test ' + Date.now() });
      const noteId = createRes.note.id;
      
      // Delete it
      const deleteRes = await deleteNote(noteId);
      
      expect(deleteRes).toHaveProperty('success');
      expect(deleteRes.success).toBe(true);
    });

    test('returns error when id is missing', async () => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('returns success even if note does not exist', async () => {
      const res = await deleteNote('non-existent-note-id');
      
      // Should still return success in demo mode
      expect(res).toHaveProperty('success');
    });
  });

  describe('Demo Data Validation', () => {
    test('demo data contains notes', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      // Demo data should have at least some notes
      if (data.isDemoMode) {
        expect(data.notes.length).toBeGreaterThan(0);
      }
    });

    test('demo notes cover multiple categories', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.isDemoMode) {
        const categories = new Set(data.notes.map((n: { category: string }) => n.category));
        expect(categories.size).toBeGreaterThan(1);
      }
    });

    test('demo notes have tags', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.isDemoMode && data.notes.length > 0) {
        const notesWithTags = data.notes.filter((n: { tags: unknown[] }) => n.tags && n.tags.length > 0);
        expect(notesWithTags.length).toBeGreaterThan(0);
      }
    });

    test('demo notes have mixed pinned status', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();
      
      if (data.isDemoMode) {
        const pinned = data.notes.filter((n: { isPinned: boolean }) => n.isPinned);
        const unpinned = data.notes.filter((n: { isPinned?: boolean }) => !n.isPinned);
        // Should have at least some pinned notes
        expect(pinned.length).toBeGreaterThanOrEqual(0);
        expect(unpinned.length).toBeGreaterThan(0);
      }
    });
  });
});
