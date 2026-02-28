// Simple in-memory store with localStorage persistence for CinePilot
// This provides actual functionality when no database is connected

// In-memory store types
export interface Script {
  id: string
  projectId: string
  title: string
  content: string
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  scenes: Scene[]
  scriptVersions: ScriptVersion[]
}

export interface Scene {
  id: string
  scriptId: string
  sceneNumber: string
  sceneIndex: number
  headingRaw: string | null
  intExt: string | null
  timeOfDay: string | null
  location: string | null
  startLine: number | null
  endLine: number | null
  confidence: number
  sceneCharacters: SceneCharacter[]
  sceneLocations: SceneLocation[]
  sceneProps: SceneProp[]
  vfxNotes: VfxNote[]
  warnings: Warning[]
}

export interface SceneCharacter {
  character: { id: string; name: string; aliases: string[] }
}

export interface SceneLocation {
  name: string
  details: string | null
}

export interface SceneProp {
  prop: { name: string }
}

export interface VfxNote {
  description: string
  vfxType: string
}

export interface Warning {
  warningType: string
  description: string
  severity: string
}

export interface ScriptVersion {
  id: string
  versionNumber: number
  extractionScore: number | null
}

export interface Character {
  id: string
  projectId: string
  name: string
  nameTamil: string | null
  description: string | null
  actorName: string | null
  isMain: boolean
}

export interface Shot {
  id: string
  scriptId: string
  sceneId: string
  shotIndex: number
  beatIndex: number
  shotText: string
  characters: string[]
  shotSize: string | null
  cameraAngle: string | null
  cameraMovement: string | null
  focalLengthMm: number | null
  lensType: string | null
  keyStyle: string | null
  colorTemp: string | null
  durationEstSec: number | null
  confidenceCamera: number | null
  confidenceLens: number | null
  confidenceLight: number | null
  confidenceDuration: number | null
  isLocked: boolean
  userEdited: boolean
}

export interface BudgetItem {
  id: string
  projectId: string
  category: string
  subcategory: string | null
  description: string | null
  quantity: string | null
  unit: string | null
  rate: string | null
  rateLow: string | null
  rateHigh: string | null
  total: string | null
  actualCost: string | null
  source: string
  notes: string | null
}

export interface Expense {
  id: string
  projectId: string
  category: string
  description: string
  amount: string
  date: string
  vendor: string | null
  status: string
  notes: string | null
}

// In-memory storage
class InMemoryStore {
  private scripts: Map<string, Script> = new Map();
  private characters: Map<string, Character> = new Map();
  private shots: Map<string, Shot> = new Map();
  private budgetItems: Map<string, BudgetItem> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private initialized = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = localStorage.getItem('cinepilot_store');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.scripts) {
          parsed.scripts.forEach((s: Script) => this.scripts.set(s.id, s));
        }
        if (parsed.characters) {
          parsed.characters.forEach((c: Character) => this.characters.set(c.id, c));
        }
        if (parsed.shots) {
          parsed.shots.forEach((s: Shot) => this.shots.set(s.id, s));
        }
        if (parsed.budgetItems) {
          parsed.budgetItems.forEach((b: BudgetItem) => this.budgetItems.set(b.id, b));
        }
        if (parsed.expenses) {
          parsed.expenses.forEach((e: Expense) => this.expenses.set(e.id, e));
        }
        console.log('[Store] Loaded from localStorage');
      }
    } catch (e) {
      console.error('[Store] Error loading from localStorage:', e);
    }
    this.initialized = true;
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined' || !this.initialized) return;
    
    try {
      const data = {
        scripts: Array.from(this.scripts.values()),
        characters: Array.from(this.characters.values()),
        shots: Array.from(this.shots.values()),
        budgetItems: Array.from(this.budgetItems.values()),
        expenses: Array.from(this.expenses.values()),
      };
      localStorage.setItem('cinepilot_store', JSON.stringify(data));
    } catch (e) {
      console.error('[Store] Error saving to localStorage:', e);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Scripts
  getScripts(projectId?: string): Script[] {
    const scripts = Array.from(this.scripts.values());
    if (projectId) {
      return scripts.filter(s => s.projectId === projectId);
    }
    return scripts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getScript(id: string): Script | undefined {
    return this.scripts.get(id);
  }

  createScript(data: Partial<Script>): Script {
    const script: Script = {
      id: this.generateId(),
      projectId: data.projectId || 'default-project',
      title: data.title || 'Untitled Script',
      content: data.content || '',
      version: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenes: data.scenes || [],
      scriptVersions: [{ id: this.generateId(), versionNumber: 1, extractionScore: null }],
    };
    this.scripts.set(script.id, script);
    this.saveToLocalStorage();
    return script;
  }

  updateScript(id: string, data: Partial<Script>): Script | undefined {
    const script = this.scripts.get(id);
    if (!script) return undefined;
    
    const updated = { ...script, ...data, updatedAt: new Date().toISOString() };
    this.scripts.set(id, updated);
    this.saveToLocalStorage();
    return updated;
  }

  // Characters
  getCharacters(projectId?: string): Character[] {
    const characters = Array.from(this.characters.values());
    if (projectId) {
      return characters.filter(c => c.projectId === projectId);
    }
    return characters;
  }

  getCharacter(id: string): Character | undefined {
    return this.characters.get(id);
  }

  createCharacter(data: Partial<Character>): Character {
    const character: Character = {
      id: this.generateId(),
      projectId: data.projectId || 'default-project',
      name: data.name || 'Unknown',
      nameTamil: data.nameTamil || null,
      description: data.description || null,
      actorName: data.actorName || null,
      isMain: data.isMain || false,
    };
    this.characters.set(character.id, character);
    this.saveToLocalStorage();
    return character;
  }

  // Shots
  getShots(scriptId?: string, sceneId?: string): Shot[] {
    let shots = Array.from(this.shots.values());
    if (scriptId) {
      shots = shots.filter(s => s.scriptId === scriptId);
    }
    if (sceneId) {
      shots = shots.filter(s => s.sceneId === sceneId);
    }
    return shots.sort((a, b) => a.shotIndex - b.shotIndex);
  }

  createShot(data: Partial<Shot>): Shot {
    const shot: Shot = {
      id: this.generateId(),
      scriptId: data.scriptId || '',
      sceneId: data.sceneId || '',
      shotIndex: data.shotIndex || 1,
      beatIndex: data.beatIndex || 1,
      shotText: data.shotText || '',
      characters: data.characters || [],
      shotSize: data.shotSize || null,
      cameraAngle: data.cameraAngle || null,
      cameraMovement: data.cameraMovement || null,
      focalLengthMm: data.focalLengthMm || null,
      lensType: data.lensType || null,
      keyStyle: data.keyStyle || null,
      colorTemp: data.colorTemp || null,
      durationEstSec: data.durationEstSec || null,
      confidenceCamera: data.confidenceCamera || null,
      confidenceLens: data.confidenceLens || null,
      confidenceLight: data.confidenceLight || null,
      confidenceDuration: data.confidenceDuration || null,
      isLocked: data.isLocked || false,
      userEdited: data.userEdited || false,
    };
    this.shots.set(shot.id, shot);
    this.saveToLocalStorage();
    return shot;
  }

  updateShot(id: string, data: Partial<Shot>): Shot | undefined {
    const shot = this.shots.get(id);
    if (!shot) return undefined;
    
    const updated = { ...shot, ...data };
    this.shots.set(id, updated);
    this.saveToLocalStorage();
    return updated;
  }

  deleteShot(id: string): boolean {
    const result = this.shots.delete(id);
    if (result) this.saveToLocalStorage();
    return result;
  }

  // Budget Items
  getBudgetItems(projectId?: string): BudgetItem[] {
    const items = Array.from(this.budgetItems.values());
    if (projectId) {
      return items.filter(i => i.projectId === projectId);
    }
    return items;
  }

  createBudgetItem(data: Partial<BudgetItem>): BudgetItem {
    const item: BudgetItem = {
      id: this.generateId(),
      projectId: data.projectId || 'default-project',
      category: data.category || 'Production',
      subcategory: data.subcategory || null,
      description: data.description || null,
      quantity: data.quantity || null,
      unit: data.unit || null,
      rate: data.rate || null,
      rateLow: data.rateLow || null,
      rateHigh: data.rateHigh || null,
      total: data.total || null,
      actualCost: data.actualCost || null,
      source: data.source || 'manual',
      notes: data.notes || null,
    };
    this.budgetItems.set(item.id, item);
    this.saveToLocalStorage();
    return item;
  }

  // Expenses
  getExpenses(projectId?: string): Expense[] {
    const expenses = Array.from(this.expenses.values());
    if (projectId) {
      return expenses.filter(e => e.projectId === projectId);
    }
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  createExpense(data: Partial<Expense>): Expense {
    const expense: Expense = {
      id: this.generateId(),
      projectId: data.projectId || 'default-project',
      category: data.category || 'Production',
      description: data.description || '',
      amount: data.amount || '0',
      date: data.date || new Date().toISOString(),
      vendor: data.vendor || null,
      status: data.status || 'pending',
      notes: data.notes || null,
    };
    this.expenses.set(expense.id, expense);
    this.saveToLocalStorage();
    return expense;
  }

  // Clear all data
  clearAll() {
    this.scripts.clear();
    this.characters.clear();
    this.shots.clear();
    this.budgetItems.clear();
    this.expenses.clear();
    this.saveToLocalStorage();
  }
}

// Export singleton instance
export const store = new InMemoryStore();
export default store;
