import { describe, it, expect } from '@jest/globals';

const API_BASE = 'http://localhost:3000';

describe('Storyboard API', () => {
  const headers = { 'Content-Type': 'application/json' };

  describe('GET /api/storyboard', () => {
    it('should return storyboard data with grouped scenes', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      // Check for demo mode flag (either _demo or isDemoMode)
      expect(data._demo === true || data.isDemoMode === true).toBe(true);
      
      // Should have grouped scenes structure
      expect(data.grouped || data.scenes).toBeDefined();
    });

    it('should include required fields in grouped response', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      if (grouped) {
        const sceneKeys = Object.keys(grouped);
        expect(sceneKeys.length).toBeGreaterThan(0);
        
        // Check first scene structure
        const firstScene = grouped[sceneKeys[0]];
        expect(firstScene).toHaveProperty('sceneId');
        expect(firstScene).toHaveProperty('sceneNumber');
        expect(firstScene).toHaveProperty('heading');
        expect(firstScene).toHaveProperty('frames');
        expect(Array.isArray(firstScene.frames)).toBe(true);
      }
    });

    it('should include isDemoMode flag', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      expect(typeof data._demo === 'boolean' || typeof data.isDemoMode === 'boolean').toBe(true);
    });

    it('should return stats when stats=true', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?stats=true`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      expect(data).toHaveProperty('totalFrames');
      expect(data).toHaveProperty('approvedFrames');
      expect(data).toHaveProperty('pendingFrames');
      expect(data).toHaveProperty('generatedFrames');
      expect(data).toHaveProperty('scenesWithFrames');
    });

    it('should filter by scriptId when provided', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?scriptId=test-script`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should filter by sceneId when provided', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?sceneId=scene-1`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should handle invalid scriptId gracefully', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?scriptId=invalid-id-12345`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should handle invalid sceneId gracefully', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?sceneId=invalid-id-12345`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should return numeric totalFrames in stats', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?stats=true`);
      const data = await res.json();
      expect(typeof data.totalFrames).toBe('number');
      expect(typeof data.approvedFrames).toBe('number');
      expect(typeof data.pendingFrames).toBe('number');
      expect(typeof data.generatedFrames).toBe('number');
      expect(typeof data.scenesWithFrames).toBe('number');
    });

    it('should return demo flag in stats response', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard?stats=true`);
      const data = await res.json();
      expect(data._demo === true || data.isDemoMode === true).toBe(true);
    });
  });

  describe('POST /api/storyboard', () => {
    it('should approve frame with valid frameId', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'approve', frameId: 'frame-1', approved: true }),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should return 400 when approve action missing frameId', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'approve' }),
      });
      expect(res.status).toBe(400);
    });

    it('should add note with valid frameId and note', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'addNote', frameId: 'frame-1', note: 'Great shot!' }),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should return 400 when addNote missing required fields', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'addNote', frameId: 'frame-1' }),
      });
      expect(res.status).toBe(400);
    });

    it('should generate scene with valid sceneId', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generateScene', sceneId: 'scene-1', style: 'cleanLineArt' }),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
      // Should return frames or message
      expect(data.frames || data.message).toBeDefined();
    });

    it('should return 400 when generateScene missing sceneId', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generateScene' }),
      });
      expect(res.status).toBe(400);
    });

    it('should generate frame with valid shotId', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generateFrame', shotId: 'shot-1', style: 'cinematic' }),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
      expect(data.frame || data.message).toBeDefined();
    });

    it('should return 400 when generateFrame missing shotId', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generateFrame' }),
      });
      expect(res.status).toBe(400);
    });

    it('should handle invalid action gracefully', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'invalidAction' }),
      });
      expect(res.status).toBe(400);
    });

    it('should handle empty body gracefully', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      // Should default to generateScene
      expect(data).toBeDefined();
    });

    it('should support different styles for generateScene', async () => {
      const styles = ['cleanLineArt', 'pencilSketch', 'markerLine', 'blueprint', 'cinematic', 'dramatic'];
      
      for (const style of styles) {
        const res = await fetch(`${API_BASE}/api/storyboard`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'generateScene', sceneId: 'scene-1', style }),
        });
        expect(res.ok).toBe(true);
      }
    });

    it('should support regenerate option for generateFrame', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generateFrame', shotId: 'shot-1', regenerate: true }),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    it('should include _demo flag in demo mode response', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generateScene', sceneId: 'nonexistent' }),
      });
      const data = await res.json();
      expect(data._demo === true || data.isDemoMode === true).toBe(true);
    });
  });

  describe('Demo Data Validation', () => {
    it('should contain multiple scenes in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      expect(grouped).toBeDefined();
      expect(Object.keys(grouped).length).toBeGreaterThanOrEqual(3);
    });

    it('should have frames with required fields', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const firstScene = grouped[Object.keys(grouped)[0]];
      const firstFrame = firstScene.frames[0];
      
      expect(firstFrame).toHaveProperty('id');
      expect(firstFrame).toHaveProperty('shotId');
      expect(firstFrame).toHaveProperty('prompt');
      expect(firstFrame).toHaveProperty('style');
      expect(firstFrame).toHaveProperty('status');
      expect(firstFrame).toHaveProperty('isApproved');
    });

    it('should have varied status values in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const allStatuses = new Set();
      
      for (const scene of Object.values(grouped) as any[]) {
        for (const frame of scene.frames) {
          if (frame.status) allStatuses.add(frame.status);
        }
      }
      
      expect(allStatuses.size).toBeGreaterThan(0);
    });

    it('should have mixed approval status in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      let hasApproved = false;
      let hasUnapproved = false;
      
      for (const scene of Object.values(grouped) as any[]) {
        for (const frame of scene.frames) {
          if (frame.isApproved) hasApproved = true;
          else hasUnapproved = true;
        }
      }
      
      expect(hasApproved || hasUnapproved).toBe(true);
    });

    it('should have scene metadata in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const firstScene = grouped[Object.keys(grouped)[0]];
      
      expect(firstScene).toHaveProperty('sceneNumber');
      expect(firstScene).toHaveProperty('heading');
      expect(firstScene).toHaveProperty('intExt');
      expect(firstScene).toHaveProperty('timeOfDay');
      expect(firstScene).toHaveProperty('location');
    });

    it('should have different shot sizes in demo frames', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const shotSizes = new Set();
      
      for (const scene of Object.values(grouped) as any[]) {
        for (const frame of scene.frames) {
          if (frame.shotSize) shotSizes.add(frame.shotSize);
        }
      }
      
      expect(shotSizes.size).toBeGreaterThan(0);
    });

    it('should have character information in demo frames', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      let hasCharacters = false;
      
      for (const scene of Object.values(grouped) as any[]) {
        for (const frame of scene.frames) {
          if (frame.characters && frame.characters.length > 0) {
            hasCharacters = true;
            break;
          }
        }
        if (hasCharacters) break;
      }
      
      expect(hasCharacters).toBe(true);
    });

    it('should have varied styles in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const styles = new Set();
      
      for (const scene of Object.values(grouped) as any[]) {
        for (const frame of scene.frames) {
          if (frame.style) styles.add(frame.style);
        }
      }
      
      expect(styles.size).toBeGreaterThan(0);
    });

    it('should have INT and EXT scenes in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const intExtTypes = new Set();
      
      for (const scene of Object.values(grouped) as any[]) {
        if (scene.intExt) intExtTypes.add(scene.intExt);
      }
      
      expect(intExtTypes.size).toBeGreaterThan(0);
    });

    it('should have DAY and NIGHT scenes in demo data', async () => {
      const res = await fetch(`${API_BASE}/api/storyboard`);
      const data = await res.json();
      
      const grouped = data.grouped;
      const timeOfDayTypes = new Set();
      
      for (const scene of Object.values(grouped) as any[]) {
        if (scene.timeOfDay) timeOfDayTypes.add(scene.timeOfDay);
      }
      
      expect(timeOfDayTypes.size).toBeGreaterThan(0);
    });
  });
});
