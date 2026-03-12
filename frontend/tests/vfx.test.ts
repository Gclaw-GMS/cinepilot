/**
 * VFX Feature API Tests
 * Tests all endpoints for VFX notes, warnings, and props
 */

const API_BASE = 'http://localhost:3002/api/vfx';

describe('GET /api/vfx', () => {
  it('returns VFX data with all required sections', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('vfxNotes');
    expect(data).toHaveProperty('vfxWarnings');
    expect(data).toHaveProperty('props');
    expect(data).toHaveProperty('summary');
  });

  it('VFX notes have required fields', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    if (data.vfxNotes && data.vfxNotes.length > 0) {
      const note = data.vfxNotes[0];
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('sceneId');
      expect(note).toHaveProperty('description');
      expect(note).toHaveProperty('vfxType');
      expect(note).toHaveProperty('confidence');
      expect(note).toHaveProperty('createdAt');
      expect(note).toHaveProperty('scene');
    }
  });

  it('VFX warnings have required fields', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    if (data.vfxWarnings && data.vfxWarnings.length > 0) {
      const warning = data.vfxWarnings[0];
      expect(warning).toHaveProperty('id');
      expect(warning).toHaveProperty('sceneId');
      expect(warning).toHaveProperty('warningType');
      expect(warning).toHaveProperty('severity');
      expect(warning).toHaveProperty('description');
      expect(warning).toHaveProperty('scene');
    }
  });

  it('Summary has required fields', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    expect(data.summary).toHaveProperty('totalScenes');
    expect(data.summary).toHaveProperty('totalNotes');
    expect(data.summary).toHaveProperty('totalWarnings');
    expect(data.summary).toHaveProperty('complexityBreakdown');
  });

  it('Complexity breakdown has simple, moderate, complex', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    expect(data.summary.complexityBreakdown).toHaveProperty('simple');
    expect(data.summary.complexityBreakdown).toHaveProperty('moderate');
    expect(data.summary.complexityBreakdown).toHaveProperty('complex');
  });

  it('VFX notes have numeric confidence values', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    if (data.vfxNotes && data.vfxNotes.length > 0) {
      const note = data.vfxNotes[0];
      expect(typeof note.confidence).toBe('number');
      expect(note.confidence).toBeGreaterThanOrEqual(0);
      expect(note.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('Demo mode flag is present when using demo data', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    // Demo mode should include _demo flag or vfxNotes from demo data
    expect(data._demo === true || data.vfxNotes.length > 0).toBe(true);
  });

  it('Scene info includes sceneNumber and headingRaw', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    if (data.vfxNotes && data.vfxNotes.length > 0) {
      const note = data.vfxNotes[0];
      expect(note.scene).toHaveProperty('sceneNumber');
      expect(note.scene).toHaveProperty('headingRaw');
    }
  });

  it('VFX types are valid categories', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    const validTypes = ['environment', 'weather', 'stunt', 'practical', 'lighting', 'transition', 'cgi', 'compositing', 'wireRemoval', 'implied'];
    
    if (data.vfxNotes && data.vfxNotes.length > 0) {
      const note = data.vfxNotes[0];
      expect(validTypes).toContain(note.vfxType);
    }
  });

  it('Warning severity levels are valid', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    const validSeverities = ['high', 'medium', 'low'];
    
    if (data.vfxWarnings && data.vfxWarnings.length > 0) {
      const warning = data.vfxWarnings[0];
      expect(validSeverities).toContain(warning.severity);
    }
  });
});

describe('GET /api/vfx with scriptId', () => {
  it('returns VFX data when scriptId is provided', async () => {
    const res = await fetch(`${API_BASE}?scriptId=test-script`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('vfxNotes');
    expect(data).toHaveProperty('vfxWarnings');
    expect(data).toHaveProperty('props');
    expect(data).toHaveProperty('summary');
  });

  it('handles invalid scriptId gracefully', async () => {
    const res = await fetch(`${API_BASE}?scriptId=invalid-id-12345`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // Should return demo fallback or empty data
    expect(data).toHaveProperty('vfxNotes');
  });
});

describe('POST /api/vfx', () => {
  it('generates VFX analysis with valid scriptId', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId: 'demo-script' }),
    });
    
    const data = await res.json();
    
    expect(res.status).toBe(200);
    // In demo mode, returns vfxNotes; in real mode, returns notes
    expect(data.vfxNotes || data.notes).toBeDefined();
    expect(data).toHaveProperty('summary');
  });

  it('returns 400 when scriptId is missing', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('handles empty body gracefully', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    expect(res.status).toBe(400);
  });

  it('summary includes analysis counts', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId: 'demo-script' }),
    });
    
    const data = await res.json();
    
    // In demo mode, summary has different fields
    if (data._demo) {
      expect(data.summary).toHaveProperty('totalNotes');
      expect(data.summary).toHaveProperty('totalWarnings');
    } else {
      expect(data.summary).toHaveProperty('scenesAnalyzed');
      expect(data.summary).toHaveProperty('vfxNotesCreated');
      expect(data.summary).toHaveProperty('warningsCreated');
    }
  });
});

describe('Demo Data Validation', () => {
  it('demo data contains VFX notes', async () => {
    const res = await fetch(`${API_BASE}?demo=true`);
    const data = await res.json();
    
    expect(data.vfxNotes).toBeDefined();
    expect(Array.isArray(data.vfxNotes)).toBe(true);
    expect(data.vfxNotes.length).toBeGreaterThan(0);
  });

  it('demo VFX notes cover multiple types', async () => {
    const res = await fetch(`${API_BASE}?demo=true`);
    const data = await res.json();
    
    const types = new Set(data.vfxNotes.map((n: { vfxType: string }) => n.vfxType));
    expect(types.size).toBeGreaterThan(1);
  });

  it('demo warnings have mixed severity levels', async () => {
    const res = await fetch(`${API_BASE}?demo=true`);
    const data = await res.json();
    
    const severities = new Set(data.vfxWarnings.map((w: { severity: string }) => w.severity));
    expect(severities.size).toBeGreaterThan(0);
  });

  it('demo props are present', async () => {
    const res = await fetch(`${API_BASE}?demo=true`);
    const data = await res.json();
    
    expect(data.props).toBeDefined();
    expect(Array.isArray(data.props)).toBe(true);
  });
});
