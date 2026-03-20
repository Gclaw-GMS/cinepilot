'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sparkles, Wand2, AlertTriangle, Film, BarChart3, TrendingUp, AlertCircle, CheckCircle, Download, DollarSign, Clock, Plus, X, Save, Edit2, Trash2, Search, Filter, RefreshCw, HelpCircle, ChevronDown, FileText, FileJson, Printer, Shield } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

type Script = { id: string; title: string };

type VfxNote = {
  id: string;
  sceneId: string;
  description: string;
  vfxType: string;
  confidence: number;
  estimatedDuration?: number;
  scene: { sceneNumber: string; headingRaw: string | null; sceneIndex: number };
};

type VfxWarning = {
  id: string;
  sceneId: string;
  warningType: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null; sceneIndex: number };
};

type VfxProp = {
  id: string;
  scene: { sceneNumber: string; headingRaw: string | null };
  prop: { name: string; description: string | null };
};

type Summary = {
  totalScenes: number;
  totalNotes: number;
  totalWarnings: number;
  complexityBreakdown: { simple: number; moderate: number; complex: number };
  estimatedTotalCost: number;
  estimatedTotalDuration: number;
};

// VFX Cost estimation constants (in INR per second)
const VFX_COST_PER_SECOND = {
  simple: 5000,
  moderate: 15000,
  complex: 45000,
};

const VFX_CATEGORIES = [
  { key: 'cgi', label: 'CGI', color: '#8b5cf6' },
  { key: 'compositing', label: 'Compositing', color: '#06b6d4' },
  { key: 'wire_removal', label: 'Wire Removal', color: '#10b981' },
  { key: 'matte_painting', label: 'Matte Painting', color: '#ef4444' },
  { key: 'simulation', label: 'Simulation', color: '#ec4899' },
  { key: 'enhancement', label: 'Enhancement', color: '#64748b' },
  { key: 'explicit', label: 'Explicit VFX', color: '#f97316' },
  { key: 'implied', label: 'Implied VFX', color: '#84cc16' },
];

// Demo data for when no real data exists
const DEMO_VFX_NOTES: VfxNote[] = [
  { id: 'demo-1', sceneId: 's1', description: 'Explosion sequence with fire and debris - requires CGI fire simulation', vfxType: 'explicit', confidence: 0.92, scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 11 } },
  { id: 'demo-2', sceneId: 's1', description: 'Bullet time effect during the chase - wire removal needed', vfxType: 'explicit', confidence: 0.85, scene: { sceneNumber: '15', headingRaw: 'EXT. CITY STREETS - NIGHT', sceneIndex: 14 } },
  { id: 'demo-3', sceneId: 's2', description: 'Supernatural glow around character hands - digital enhancement', vfxType: 'explicit', confidence: 0.78, scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT', sceneIndex: 22 } },
  { id: 'demo-4', sceneId: 's3', description: 'City skyline with digital matte painting for timeline change', vfxType: 'implied', confidence: 0.65, scene: { sceneNumber: '5', headingRaw: 'EXT. ROOFTOP - SUNSET', sceneIndex: 4 } },
  { id: 'demo-5', sceneId: 's4', description: 'Blood splatter removal for UA certificate', vfxType: 'explicit', confidence: 0.55, scene: { sceneNumber: '31', headingRaw: 'INT. WAREHOUSE - NIGHT', sceneIndex: 30 } },
  { id: 'demo-6', sceneId: 's5', description: 'Reflective eyes effect for the antagonist', vfxType: 'implied', confidence: 0.42, scene: { sceneNumber: '18', headingRaw: 'INT. VILLAIN LAIR - NIGHT', sceneIndex: 17 } },
  { id: 'demo-7', sceneId: 's6', description: 'Weather effects - rain and mist for atmosphere', vfxType: 'implied', confidence: 0.35, scene: { sceneNumber: '8', headingRaw: 'EXT. FOREST - NIGHT', sceneIndex: 7 } },
];

const DEMO_VFX_WARNINGS: VfxWarning[] = [
  { id: 'w1', sceneId: 's1', warningType: 'vfx', description: 'High VFX complexity detected - budget impact likely for Scene 12', severity: 'high', scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 11 } },
  { id: 'w2', sceneId: 's2', warningType: 'vfx', description: 'Bullet time effect requires specialized crew - check availability', severity: 'medium', scene: { sceneNumber: '15', headingRaw: 'EXT. CITY STREETS - NIGHT', sceneIndex: 14 } },
  { id: 'w3', sceneId: 's3', warningType: 'vfx', description: 'Scene 23 glow effect may affect certification - review content', severity: 'medium', scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT', sceneIndex: 22 } },
];

const DEMO_VFX_PROPS: VfxProp[] = [
  { id: 'p1', scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT' }, prop: { name: 'Explosion Debris', description: 'CGI debris particles' } },
  { id: 'p2', scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT' }, prop: { name: 'Supernatural Glow', description: 'Digital aura effect' } },
];

const DEMO_SUMMARY: Summary = {
  totalScenes: 7,
  totalNotes: 9,
  totalWarnings: 4,
  complexityBreakdown: { simple: 3, moderate: 3, complex: 3 },
  estimatedTotalCost: 6765000,
  estimatedTotalDuration: 225,
};

const DEMO_SCRIPTS: Script[] = [
  { id: 'demo-script-1', title: 'Thunivu (Demo Script)' },
  { id: 'demo-script-2', title: 'Jawan (Demo Script)' },
];

const COMPLEXITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  simple: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600' },
  moderate: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
  complex: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50' },
};

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function getComplexity(confidence: number): string {
  if (confidence >= 0.8) return 'complex';
  if (confidence >= 0.5) return 'moderate';
  return 'simple';
}

function getComplexityStyle(complexity: string) {
  return COMPLEXITY_STYLES[complexity] || COMPLEXITY_STYLES.simple;
}

function getVfxCategoryColor(vfxType: string): string {
  const category = VFX_CATEGORIES.find(c => c.key === vfxType);
  return category?.color || '#64748b';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function VfxPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [vfxNotes, setVfxNotes] = useState<VfxNote[]>([]);
  const [vfxWarnings, setVfxWarnings] = useState<VfxWarning[]>([]);
  const [vfxProps, setVfxProps] = useState<VfxProp[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUsingDemo, setIsUsingDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'cost' | 'conflicts'>('overview');

  // Form states for add/edit
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<VfxNote | null>(null);
  const [formData, setFormData] = useState({
    sceneNumber: '',
    description: '',
    vfxType: 'explicit',
    confidence: 70,
    estimatedDuration: 30,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<'scene' | 'type' | 'confidence' | 'complexity'>('scene');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort options
  const sortOptions = [
    { key: 'scene', label: 'Scene Number' },
    { key: 'type', label: 'VFX Type' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'complexity', label: 'Complexity' },
  ];

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  // Budget tracking state
  const [budgetLimit, setBudgetLimit] = useState<number>(5000000); // Default ₹5Cr VFX budget

  // Budget calculations
  const budgetUsedPercent = useMemo(() => {
    if (!summary || budgetLimit === 0) return 0;
    return Math.round((summary.estimatedTotalCost / budgetLimit) * 100);
  }, [summary, budgetLimit]);

  const budgetRemaining = useMemo(() => {
    if (!summary) return budgetLimit;
    return budgetLimit - summary.estimatedTotalCost;
  }, [summary, budgetLimit]);

  const isOverBudget = useMemo(() => {
    if (!summary) return false;
    return summary.estimatedTotalCost > budgetLimit;
  }, [summary, budgetLimit]);

  const isWarning = useMemo(() => {
    if (!summary || isOverBudget) return false;
    return budgetUsedPercent >= 80;
  }, [summary, budgetUsedPercent, isOverBudget]);

  const budgetStatus = useMemo(() => {
    if (isOverBudget) return 'over';
    if (isWarning) return 'warning';
    return 'ok';
  }, [isOverBudget, isWarning]);

  // Refs for keyboard shortcuts and menus
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fetchDataRef = useRef<() => void | Promise<void>>();
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const showFiltersRef = useRef(showFilters);
  const typeFilterRef = useRef(typeFilter);
  const complexityFilterRef = useRef(complexityFilter);
  
  // Sync refs with state for keyboard shortcuts
  useEffect(() => { showFiltersRef.current = showFilters }, [showFilters]);
  useEffect(() => { typeFilterRef.current = typeFilter }, [typeFilter]);
  useEffect(() => { complexityFilterRef.current = complexityFilter }, [complexityFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setTypeFilter('all')
    setComplexityFilter('all')
    setSortBy('scene')
    setSortOrder('asc')
  }, [])

  // Ref for clearFilters
  const clearFiltersRef = useRef(clearFilters)
  useEffect(() => { clearFiltersRef.current = clearFilters }, [clearFilters])

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (typeFilter !== 'all') count++;
    if (complexityFilter !== 'all') count++;
    if (sortBy !== 'scene' || sortOrder !== 'asc') count++;
    return count;
  }, [searchQuery, typeFilter, complexityFilter, sortBy, sortOrder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          fetchDataRef.current?.()
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'n':
          e.preventDefault()
          if (selectedScript && !showNoteForm) {
            setShowNoteForm(true)
            setEditingNote(null)
            setFormData({ sceneNumber: '', description: '', vfxType: 'explicit', confidence: 70, estimatedDuration: 30 })
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          setSearchQuery('')
          setTypeFilter('all')
          setComplexityFilter('all')
          setSortBy('scene')
          setSortOrder('asc')
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCount > 0) {
            clearFiltersRef.current()
          }
          break
        case 's':
          e.preventDefault()
          toggleSortOrder()
          break
        case 'e':
          if (vfxNotes.length > 0 || vfxWarnings.length > 0) {
            e.preventDefault()
            setShowExportMenu(prev => !prev)
          }
          break
        case 'm':
          if (vfxNotes.length > 0 || vfxWarnings.length > 0) {
            e.preventDefault()
            exportToMarkdownRef.current()
          }
          break
        case 'p':
          if (vfxNotes.length > 0) {
            e.preventDefault()
            setShowPrintMenu(prev => !prev)
          }
          break
        // Context-aware number keys
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
          e.preventDefault()
          const num = parseInt(e.key)
          if (showFiltersRef.current) {
            // When filter panel is OPEN: filter by type or complexity
            // Type filter: 1-3 = CGI, Compositing, Wire Removal
            // Complexity filter: Shift+1-3 = Simple, Moderate, Complex
            if (e.shiftKey) {
              // Shift+1-3: Complexity filter
              if (num >= 1 && num <= 3) {
                const complexityOptions = ['simple', 'moderate', 'complex']
                const complexity = complexityOptions[num - 1]
                // Toggle: if same complexity selected, clear to all
                setComplexityFilter(complexityFilterRef.current === complexity ? 'all' : complexity)
              } else if (num === 0) {
                // Shift+0 clears complexity filter
                setComplexityFilter('all')
              }
            } else {
              // 1-8: Type filter
              if (num >= 1 && num <= 8) {
                const typeIndex = num - 1
                const typeKey = VFX_CATEGORIES[typeIndex]?.key
                if (typeKey) {
                  // Toggle: if same type selected, clear to all
                  setTypeFilter(typeFilterRef.current === typeKey ? 'all' : typeKey)
                }
              } else if (num === 0) {
                // 0 clears type filter
                setTypeFilter('all')
              }
            }
          } else {
            // When filter panel is CLOSED: switch tabs
            switch (e.key) {
              case '1':
                setActiveTab('overview')
                break
              case '2':
                setActiveTab('scenes')
                break
              case '3':
                setActiveTab('cost')
                break
              case '4':
                setActiveTab('conflicts')
                break
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedScript, showNoteForm, vfxNotes.length, vfxWarnings.length, showFilters, activeFilterCount])

  // Click outside to close export menu and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showPrintMenu, showFilters])

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        if (list.length > 0) {
          setScripts(list);
          // Auto-select first script if available
          setSelectedScript(list[0].id);
        } else {
          // Use demo scripts if no real scripts exist
          setScripts(DEMO_SCRIPTS);
          setIsUsingDemo(true);
          // Auto-select first demo script
          if (DEMO_SCRIPTS.length > 0) {
            setSelectedScript(DEMO_SCRIPTS[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to demo scripts on error
        setScripts(DEMO_SCRIPTS);
        setIsUsingDemo(true);
        // Auto-select first demo script
        if (DEMO_SCRIPTS.length > 0) {
          setSelectedScript(DEMO_SCRIPTS[0].id);
        }
      });
  }, []);

  // Filtered notes based on search and filters
  const filteredNotes = useMemo(() => {
    let notes = [...vfxNotes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      notes = notes.filter(n =>
        n.description.toLowerCase().includes(query) ||
        n.scene.sceneNumber.includes(query) ||
        n.scene.headingRaw?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      notes = notes.filter(n => n.vfxType === typeFilter);
    }

    // Complexity filter
    if (complexityFilter !== 'all') {
      notes = notes.filter(n => getComplexity(n.confidence) === complexityFilter);
    }

    // Apply sorting
    notes.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'scene':
          comparison = a.scene.sceneIndex - b.scene.sceneIndex;
          break;
        case 'type':
          comparison = a.vfxType.localeCompare(b.vfxType);
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'complexity':
          const aComplexity = getComplexity(a.confidence);
          const bComplexity = getComplexity(b.confidence);
          const complexityOrder: Record<string, number> = { simple: 1, moderate: 2, complex: 3 };
          comparison = (complexityOrder[aComplexity] || 0) - (complexityOrder[bComplexity] || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return notes;
  }, [vfxNotes, searchQuery, typeFilter, complexityFilter, sortBy, sortOrder]);

  // Group filtered notes by scene
  const filteredSceneGroups = useMemo(() => {
    const groups = new Map<string, { heading: string | null; notes: VfxNote[]; warnings: VfxWarning[]; props: VfxProp[] }>();
    for (const note of filteredNotes) {
      const key = note.scene.sceneNumber;
      if (!groups.has(key)) {
        groups.set(key, { heading: note.scene.headingRaw, notes: [], warnings: [], props: [] });
      }
      groups.get(key)!.notes.push(note);
    }
    // Add warnings and props
    for (const warn of vfxWarnings) {
      const key = warn.scene.sceneNumber;
      if (!groups.has(key)) {
        groups.set(key, { heading: warn.scene.headingRaw, notes: [], warnings: [], props: [] });
      }
      groups.get(key)!.warnings.push(warn);
    }
    for (const prop of vfxProps) {
      const key = prop.scene.sceneNumber;
      if (!groups.has(key)) {
        groups.set(key, { heading: prop.scene.headingRaw, notes: [], warnings: [], props: [] });
      }
      groups.get(key)!.props.push(prop);
    }
    return [...groups.entries()].sort((a, b) => {
      const aIdx = filteredNotes.find(n => n.scene.sceneNumber === a[0])?.scene.sceneIndex ?? 0;
      const bIdx = filteredNotes.find(n => n.scene.sceneNumber === b[0])?.scene.sceneIndex ?? 0;
      return aIdx - bIdx;
    });
  }, [filteredNotes, vfxWarnings, vfxProps]);

  // VFX Conflict Detection
  type Conflict = {
    id: string;
    type: 'budget' | 'certification' | 'complexity' | 'timeline' | 'technical';
    severity: 'high' | 'medium' | 'low';
    scene: string;
    sceneHeading: string | null;
    title: string;
    description: string;
    recommendation?: string;
  };

  const vfxConflicts = useMemo(() => {
    const conflicts: Conflict[] = [];
    const COMPLEX_SCENE_THRESHOLD = 3;
    const EXPLICIT_CONTENT_WARNING = ['explicit', 'blood', 'violence', 'gore'];

    // 1. Budget Overrun Detection
    if (summary && summary.estimatedTotalCost > budgetLimit) {
      const overrun = summary.estimatedTotalCost - budgetLimit;
      conflicts.push({
        id: 'budget-1',
        type: 'budget',
        severity: overrun > 2000000 ? 'high' : 'medium',
        scene: 'All',
        sceneHeading: null,
        title: 'Budget Overrun Warning',
        description: `Estimated VFX cost (₹${(summary.estimatedTotalCost / 100000).toFixed(1)}L) exceeds budget limit (₹${budgetLimit / 100000}L) by ₹${(overrun / 100000).toFixed(1)}L`,
        recommendation: 'Consider simplifying complex shots or moving some VFX to post-production'
      });
    }

    // 2. Complex Scene Detection
    const complexScenes = vfxNotes.filter(n => n.vfxType === 'explicit' || n.vfxType === 'simulation');
    if (complexScenes.length > COMPLEX_SCENE_THRESHOLD) {
      const complexSceneNumbers = [...new Set(complexScenes.map(n => n.scene.sceneNumber))].slice(0, 5);
      conflicts.push({
        id: 'complexity-1',
        type: 'complexity',
        severity: complexScenes.length > 6 ? 'high' : 'medium',
        scene: complexSceneNumbers.join(', '),
        sceneHeading: complexScenes[0]?.scene.headingRaw || null,
        title: 'High Complexity Scenes Detected',
        description: `${complexScenes.length} complex VFX shots detected (explicit content, simulations). This may impact production timeline.`,
        recommendation: 'Schedule these shots early in the shoot to allow buffer time for corrections'
      });
    }

    // 3. Certification Issues Detection
    const explicitNotes = vfxNotes.filter(n =>
      n.vfxType === 'explicit' || n.description.toLowerCase().includes('blood') ||
      n.description.toLowerCase().includes('violence') || n.description.toLowerCase().includes('gore')
    );
    if (explicitNotes.length > 0) {
      const uniqueScenes = [...new Set(explicitNotes.map(n => n.scene.sceneNumber))];
      conflicts.push({
        id: 'cert-1',
        type: 'certification',
        severity: 'high',
        scene: uniqueScenes.join(', '),
        sceneHeading: explicitNotes[0]?.scene.headingRaw || null,
        title: 'Certification Risk Detected',
        description: `${explicitNotes.length} explicit VFX shots detected across ${uniqueScenes.length} scenes. May require UA/A certification cuts.`,
        recommendation: 'Plan for alternate takes or post-production edits for theatrical release'
      });
    }

    // 4. Low Confidence Detection (Technical Feasibility)
    const lowConfidenceNotes = vfxNotes.filter(n => n.confidence < 0.5);
    if (lowConfidenceNotes.length > 0) {
      conflicts.push({
        id: 'tech-1',
        type: 'technical',
        severity: 'low',
        scene: lowConfidenceNotes.map(n => n.scene.sceneNumber).join(', '),
        sceneHeading: lowConfidenceNotes[0]?.scene.headingRaw || null,
        title: 'Low Confidence VFX Shots',
        description: `${lowConfidenceNotes.length} VFX shots have low confidence scores (<50%). These may need additional planning or reference material.`,
        recommendation: 'Gather more reference material or consult with VFX supervisor for these shots'
      });
    }

    // 5. Timeline Conflict - too many VFX shots per scene
    const sceneVfxCount = new Map<string, number>();
    vfxNotes.forEach(note => {
      const count = sceneVfxCount.get(note.scene.sceneNumber) || 0;
      sceneVfxCount.set(note.scene.sceneNumber, count + 1);
    });
    sceneVfxCount.forEach((count, sceneNum) => {
      if (count > 5) {
        const note = vfxNotes.find(n => n.scene.sceneNumber === sceneNum);
        conflicts.push({
          id: `timeline-${sceneNum}`,
          type: 'timeline',
          severity: count > 8 ? 'high' : 'medium',
          scene: sceneNum,
          sceneHeading: note?.scene.headingRaw || null,
          title: 'High VFX Shot Count',
          description: `Scene ${sceneNum} has ${count} VFX shots - may require multiple shoot days or extended post time.`,
          recommendation: 'Consider splitting into pickup shoots or simplifying during pre-production'
        });
      }
    });

    return conflicts;
  }, [vfxNotes, summary, budgetLimit]);

  // Conflict stats
  const conflictStats = useMemo(() => ({
    total: vfxConflicts.length,
    high: vfxConflicts.filter(c => c.severity === 'high').length,
    medium: vfxConflicts.filter(c => c.severity === 'medium').length,
    low: vfxConflicts.filter(c => c.severity === 'low').length,
  }), [vfxConflicts]);

  // Form handlers
  const resetForm = () => {
    setFormData({ sceneNumber: '', description: '', vfxType: 'explicit', confidence: 70, estimatedDuration: 30 });
    setFormErrors({});
    setEditingNote(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowNoteForm(true);
  };

  const openEditForm = (note: VfxNote) => {
    setEditingNote(note);
    setFormData({
      sceneNumber: note.scene.sceneNumber,
      description: note.description,
      vfxType: note.vfxType,
      confidence: Math.round(note.confidence * 100),
      estimatedDuration: note.estimatedDuration || 30,
    });
    setShowNoteForm(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.sceneNumber.trim()) errors.sceneNumber = 'Scene number is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.confidence < 0 || formData.confidence > 100) errors.confidence = 'Confidence must be 0-100';
    if (formData.estimatedDuration < 1) errors.estimatedDuration = 'Duration must be at least 1 second';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveNote = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      if (editingNote) {
        // Update existing note
        const updatedNotes = vfxNotes.map(n =>
          n.id === editingNote.id
            ? {
                ...n,
                description: formData.description,
                vfxType: formData.vfxType,
                confidence: formData.confidence / 100,
                estimatedDuration: formData.estimatedDuration,
                scene: { ...n.scene, sceneNumber: formData.sceneNumber }
              }
            : n
        );
        setVfxNotes(updatedNotes);
        setSummary(calculateSummaryCost(updatedNotes, vfxWarnings));
        setSuccess('VFX note updated successfully!');
      } else {
        // Add new note
        const newNote: VfxNote = {
          id: `manual-${Date.now()}`,
          sceneId: `scene-${formData.sceneNumber}`,
          description: formData.description,
          vfxType: formData.vfxType,
          confidence: formData.confidence / 100,
          estimatedDuration: formData.estimatedDuration,
          scene: {
            sceneNumber: formData.sceneNumber,
            headingRaw: `Scene ${formData.sceneNumber}`,
            sceneIndex: parseInt(formData.sceneNumber) || 0
          }
        };
        const updatedNotes = [...vfxNotes, newNote];
        setVfxNotes(updatedNotes);
        setSummary(calculateSummaryCost(updatedNotes, vfxWarnings));
        setSuccess('VFX note added successfully!');
      }
      setShowNoteForm(false);
      resetForm();
    } catch (err) {
      setError('Failed to save VFX note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Are you sure you want to delete this VFX note?')) return;
    const updatedNotes = vfxNotes.filter(n => n.id !== noteId);
    setVfxNotes(updatedNotes);
    setSummary(calculateSummaryCost(updatedNotes, vfxWarnings));
    setSuccess('VFX note deleted successfully!');
  };

  // Calculate cost and duration from VFX notes
  const calculateSummaryCost = useCallback((notes: VfxNote[], warnings: VfxWarning[]) => {
    const complexityBreakdown = { simple: 0, moderate: 0, complex: 0 };
    let totalCost = 0;
    let totalDuration = 0;

    for (const note of notes) {
      const complexity = getComplexity(note.confidence);
      complexityBreakdown[complexity as keyof typeof complexityBreakdown]++;
      const costPerSec = VFX_COST_PER_SECOND[complexity as keyof typeof VFX_COST_PER_SECOND];
      totalCost += costPerSec * (note.estimatedDuration || 30);
      totalDuration += note.estimatedDuration || 30;
    }

    const sceneSet = new Set(notes.map(n => n.scene.sceneNumber));

    return {
      totalScenes: sceneSet.size,
      totalNotes: notes.length,
      totalWarnings: warnings.length,
      complexityBreakdown,
      estimatedTotalCost: totalCost,
      estimatedTotalDuration: totalDuration,
    };
  }, []);

  // Assign fetchVfxData to ref for keyboard shortcuts
  const fetchVfxData = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vfx?scriptId=${scriptId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      // Use real data if available, otherwise use demo data
      if (data.vfxNotes && data.vfxNotes.length > 0) {
        setVfxNotes(data.vfxNotes || []);
        setVfxWarnings(data.vfxWarnings || []);
        setVfxProps(data.props || []);
        setSummary(calculateSummaryCost(data.vfxNotes || [], data.vfxWarnings || []));
        setIsUsingDemo(false);
      } else {
        // Load demo data when no real data exists
        setVfxNotes(DEMO_VFX_NOTES);
        setVfxWarnings(DEMO_VFX_WARNINGS);
        setVfxProps(DEMO_VFX_PROPS);
        setSummary(DEMO_SUMMARY);
        setIsUsingDemo(true);
      }
    } catch (err) {
      // On error, load demo data for better UX
      console.warn('Using demo VFX data:', err);
      setVfxNotes(DEMO_VFX_NOTES);
      setVfxWarnings(DEMO_VFX_WARNINGS);
      setVfxProps(DEMO_VFX_PROPS);
      setSummary(DEMO_SUMMARY);
      setIsUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, [calculateSummaryCost]);

  // Assign to ref for keyboard shortcuts
  fetchDataRef.current = () => {
    if (selectedScript) fetchVfxData(selectedScript);
  };

  useEffect(() => {
    if (selectedScript) fetchVfxData(selectedScript);
  }, [selectedScript, fetchVfxData]);

  async function runAnalysis() {
    if (!selectedScript) return;
    setAnalyzing(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/vfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      await fetchVfxData(selectedScript);
      setSuccess(`Analysis complete! Found ${data.notes?.length || 0} VFX shots in ${data.summary?.scenesAnalyzed || 0} scenes.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VFX analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  // Toggle export menu
  function handleExport() {
    if (vfxNotes.length > 0 || vfxWarnings.length > 0) {
      setShowExportMenu(prev => !prev)
    }
  }

  // Export VFX data to CSV
  function exportToCSV() {
    const headers = ['Scene', 'Heading', 'Type', 'Description', 'Confidence', 'Severity', 'Warning'];
    const scenesToExport = isFilterOrSortActive ? displayScenes : [...sceneGroups.entries()].sort((a, b) => {
      const aIdx = vfxNotes.find((n) => n.scene.sceneNumber === a[0])?.scene.sceneIndex ?? 0;
      const bIdx = vfxNotes.find((n) => n.scene.sceneNumber === b[0])?.scene.sceneIndex ?? 0;
      return aIdx - bIdx;
    });
    const rows = scenesToExport.map(([sceneNum, group]) => {
      const notes = group.notes.map(n => ({
        scene: sceneNum,
        heading: group.heading || '',
        type: n.vfxType,
        description: n.description,
        confidence: Math.round(n.confidence * 100) + '%',
        severity: '',
        warning: ''
      }));
      const warnings = group.warnings.map(w => ({
        scene: sceneNum,
        heading: group.heading || '',
        type: w.warningType,
        description: w.description,
        confidence: '',
        severity: w.severity,
        warning: w.description
      }));
      return [...notes, ...warnings];
    }).flat();

    const csv = [headers, ...rows.map(r => [r.scene, r.heading, r.type, r.description, r.confidence, r.severity, r.warning].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vfx-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }

  // Export VFX data to JSON
  function exportToJSON() {
    const notesToExport = isFilterOrSortActive ? filteredNotes : vfxNotes;
    const exportData = {
      exportedAt: new Date().toISOString(),
      scriptId: selectedScript,
      scriptTitle: scripts.find(s => s.id === selectedScript)?.title || 'Unknown',
      filters: isFilterOrSortActive ? {
        searchQuery,
        typeFilter,
        complexityFilter,
        sortBy,
        sortOrder,
      } : null,
      summary: summary ? {
        totalScenes: summary.totalScenes,
        totalNotes: summary.totalNotes,
        totalWarnings: summary.totalWarnings,
        complexityBreakdown: summary.complexityBreakdown,
        estimatedTotalCost: summary.estimatedTotalCost,
        estimatedTotalDuration: summary.estimatedTotalDuration,
      } : null,
      notes: notesToExport.map(n => ({
        scene: n.scene.sceneNumber,
        heading: n.scene.headingRaw,
        type: n.vfxType,
        description: n.description,
        confidence: Math.round(n.confidence * 100) + '%',
        estimatedDuration: n.estimatedDuration,
      })),
      warnings: vfxWarnings.map(w => ({
        scene: w.scene.sceneNumber,
        heading: w.scene.headingRaw,
        type: w.warningType,
        description: w.description,
        severity: w.severity,
      })),
      props: vfxProps.map(p => ({
        scene: p.scene.sceneNumber,
        heading: p.scene.headingRaw,
        prop: p.prop.name,
        description: p.prop.description,
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vfx-breakdown-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }

  // Print VFX Report
  function printVfxReport() {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const scriptTitle = scripts.find(s => s.id === selectedScript)?.title || 'Unknown Script';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>VFX Breakdown - ${scriptTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
    .summary-card.budget .value { color: #10b981; }
    .summary-card.warning .value { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f5f5f5; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; }
    .scene-header { background: #8b5cf6; color: white; font-weight: bold; }
    .scene-header td { padding: 10px 12px; }
    .complexity-simple { background: #f0f0f0; color: #666; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .complexity-moderate { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .complexity-complex { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .warning-row { background: #fffbeb; }
    .warning-icon { color: #f59e0b; }
    .type-explicit { color: #8b5cf6; font-weight: 500; }
    .type-implied { color: #10b981; font-weight: 500; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>VFX Breakdown Report</h1>
    <p>${scriptTitle} - Generated on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">VFX Scenes</div>
      <div class="value">${summary?.totalScenes || 0}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Shots</div>
      <div class="value">${summary?.totalNotes || 0}</div>
    </div>
    <div class="summary-card budget">
      <div class="label">Est. Budget</div>
      <div class="value">${summary ? formatCurrency(summary.estimatedTotalCost) : '₹0'}</div>
    </div>
    <div class="summary-card">
      <div class="label">Simple</div>
      <div class="value">${summary?.complexityBreakdown.simple || 0}</div>
    </div>
    <div class="summary-card">
      <div class="label">Moderate</div>
      <div class="value">${summary?.complexityBreakdown.moderate || 0}</div>
    </div>
    <div class="summary-card warning">
      <div class="label">Warnings</div>
      <div class="value">${summary?.totalWarnings || 0}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 60px;">Scene</th>
        <th style="width: 80px;">Type</th>
        <th>Description</th>
        <th style="width: 80px;">Complexity</th>
        <th style="width: 70px;">Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${displayScenes.map(([sceneNum, group]) => {
        const maxConf = Math.max(...group.notes.map(n => n.confidence), 0);
        const complexity = getComplexity(maxConf);
        const compClass = `complexity-${complexity}`;

        return `
          <tr class="scene-header">
            <td colspan="5">Scene ${sceneNum}${group.heading ? ' - ' + group.heading : ''}</td>
          </tr>
          ${group.notes.map(note => {
            const noteComplexity = getComplexity(note.confidence);
            return `
              <tr>
                <td>${note.scene.sceneNumber}</td>
                <td class="type-${note.vfxType}">${note.vfxType === 'explicit' ? 'Explicit' : 'Implied'}</td>
                <td>${note.description}</td>
                <td><span class="${`complexity-${noteComplexity}`}">${noteComplexity}</span></td>
                <td>${Math.round(note.confidence * 100)}%</td>
              </tr>
            `;
          }).join('')}
          ${group.warnings.map(warn => `
            <tr class="warning-row">
              <td>${warn.scene.sceneNumber}</td>
              <td class="warning-icon">⚠ Warning</td>
              <td>${warn.description}</td>
              <td><span class="complexity-${warn.severity === 'high' ? 'complex' : 'moderate'}">${warn.severity}</span></td>
              <td>-</td>
            </tr>
          `).join('')}
        `;
      }).join('')}
    </tbody>
  </table>

  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    Generated by CinePilot - VFX Breakdown Tool
  </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    setShowPrintMenu(false);
  }

  const sceneGroups = new Map<
    string,
    { heading: string | null; notes: VfxNote[]; warnings: VfxWarning[]; props: VfxProp[] }
  >();
  for (const note of vfxNotes) {
    const key = note.scene.sceneNumber;
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, { heading: note.scene.headingRaw, notes: [], warnings: [], props: [] });
    }
    sceneGroups.get(key)!.notes.push(note);
  }
  for (const warn of vfxWarnings) {
    const key = warn.scene.sceneNumber;
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, { heading: warn.scene.headingRaw, notes: [], warnings: [], props: [] });
    }
    sceneGroups.get(key)!.warnings.push(warn);
  }
  for (const prop of vfxProps) {
    const key = prop.scene.sceneNumber;
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, { heading: prop.scene.headingRaw, notes: [], warnings: [], props: [] });
    }
    sceneGroups.get(key)!.props.push(prop);
  }

  // Use filtered scenes for display when filters or sort are active, otherwise use all scenes
  const isFilterOrSortActive = searchQuery || typeFilter !== 'all' || complexityFilter !== 'all' || sortBy !== 'scene' || sortOrder !== 'asc';
  const displayScenes = isFilterOrSortActive
    ? filteredSceneGroups
    : [...sceneGroups.entries()].sort((a, b) => {
        const aIdx = vfxNotes.find((n) => n.scene.sceneNumber === a[0])?.scene.sceneIndex ?? 0;
        const bIdx = vfxNotes.find((n) => n.scene.sceneNumber === b[0])?.scene.sceneIndex ?? 0;
        return aIdx - bIdx;
      });

  // Export VFX data to Markdown
  const exportToMarkdown = useCallback(() => {
    if (vfxNotes.length === 0 && vfxWarnings.length === 0) return;
    
    const notesToExport = isFilterOrSortActive ? filteredNotes : vfxNotes;
    const scriptTitle = scripts.find(s => s.id === selectedScript)?.title || 'Unknown';
    
    // Calculate summary statistics
    const totalNotes = notesToExport.length;
    const totalWarnings = vfxWarnings.length;
    const explicitNotes = notesToExport.filter(n => n.vfxType === 'explicit' || n.vfxType === 'simulation').length;
    const impliedNotes = notesToExport.filter(n => n.vfxType === 'implied').length;
    const highConfidenceNotes = notesToExport.filter(n => n.confidence >= 0.7).length;
    const mediumConfidenceNotes = notesToExport.filter(n => n.confidence >= 0.4 && n.confidence < 0.7).length;
    const lowConfidenceNotes = notesToExport.filter(n => n.confidence < 0.4).length;
    
    // Complexity breakdown
    const complexityCounts = notesToExport.reduce((acc, note) => {
      const conf = note.confidence;
      if (conf >= 0.7) acc.complex++;
      else if (conf >= 0.4) acc.moderate++;
      else acc.simple++;
      return acc;
    }, { simple: 0, moderate: 0, complex: 0 });

    // Category breakdown
    const categoryCounts = notesToExport.reduce((acc, note) => {
      acc[note.vfxType] = (acc[note.vfxType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Warning severity breakdown
    const severityCounts = vfxWarnings.reduce((acc, w) => {
      acc[w.severity] = (acc[w.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const getCategoryLabel = (cat: string) => {
      const labels: Record<string, string> = {
        'cgi': '🖥️ CGI',
        'compositing': '🎬 Compositing',
        'wire_removal': '〰️ Wire Removal',
        'matte_painting': '🎨 Matte Painting',
        'simulation': '💨 Simulation',
        'enhancement': '✨ Enhancement',
        'explicit': '🔴 Explicit VFX',
        'implied': '🟢 Implied VFX',
      };
      return labels[cat] || cat;
    };
    
    const getSeverityIcon = (sev: string) => {
      if (sev === 'high') return '🔴';
      if (sev === 'medium') return '🟡';
      return '🟢';
    };
    
    let markdown = `# VFX Breakdown - CinePilot

## Executive Summary

| Metric | Value |
|--------|-------|
| **Script** | ${scriptTitle} |
| **Total VFX Shots** | ${totalNotes} |
| **Total Warnings** | ${totalWarnings} |
| **Explicit VFX** | ${explicitNotes} |
| **Implied VFX** | ${impliedNotes} |
| **Estimated Cost** | ₹${(summary?.estimatedTotalCost || 0).toLocaleString()} |
| **Estimated Duration** | ${summary?.estimatedTotalDuration || 0} seconds |

## Confidence Distribution

| Confidence Level | Count | Percentage |
|------------------|-------|------------|
| 🟢 High (70%+) | ${highConfidenceNotes} | ${totalNotes > 0 ? Math.round((highConfidenceNotes / totalNotes) * 100) : 0}% |
| 🟡 Medium (40-69%) | ${mediumConfidenceNotes} | ${totalNotes > 0 ? Math.round((mediumConfidenceNotes / totalNotes) * 100) : 0}% |
| 🔴 Low (<40%) | ${lowConfidenceNotes} | ${totalNotes > 0 ? Math.round((lowConfidenceNotes / totalNotes) * 100) : 0}% |

## Complexity Breakdown

| Complexity | Count | Percentage |
|------------|-------|------------|
| 🔴 Complex (70%+) | ${complexityCounts.complex} | ${totalNotes > 0 ? Math.round((complexityCounts.complex / totalNotes) * 100) : 0}% |
| 🟡 Moderate (40-69%) | ${complexityCounts.moderate} | ${totalNotes > 0 ? Math.round((complexityCounts.moderate / totalNotes) * 100) : 0}% |
| 🟢 Simple (<40%) | ${complexityCounts.simple} | ${totalNotes > 0 ? Math.round((complexityCounts.simple / totalNotes) * 100) : 0}% |

## Category Breakdown

| Category | Count |
|----------|-------|
`;
    
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      markdown += `| ${getCategoryLabel(cat)} | ${count} |\n`;
    });
    
    if (vfxWarnings.length > 0) {
      markdown += `
## Warning Severity Breakdown

| Severity | Count |
|----------|-------|
`;
      Object.entries(severityCounts).forEach(([sev, count]) => {
        markdown += `| ${getSeverityIcon(sev)} ${sev.charAt(0).toUpperCase() + sev.slice(1)} | ${count} |\n`;
      });
    }
    
    if (notesToExport.length > 0) {
      markdown += `
## VFX Shots Detail

| Scene | Heading | Type | Description | Confidence |
|-------|---------|------|-------------|------------|
`;
      notesToExport.forEach(note => {
        const confidencePct = Math.round(note.confidence * 100);
        const confIcon = confidencePct >= 70 ? '🟢' : confidencePct >= 40 ? '🟡' : '🔴';
        markdown += `| ${note.scene.sceneNumber} | ${note.scene.headingRaw || '-'} | ${getCategoryLabel(note.vfxType)} | ${note.description.substring(0, 50)}${note.description.length > 50 ? '...' : ''} | ${confIcon} ${confidencePct}% |\n`;
      });
    }
    
    if (vfxWarnings.length > 0) {
      markdown += `
## Warnings Detail

| Scene | Heading | Severity | Description |
|-------|---------|----------|-------------|
`;
      vfxWarnings.forEach(warn => {
        markdown += `| ${warn.scene.sceneNumber} | ${warn.scene.headingRaw || '-'} | ${getSeverityIcon(warn.severity)} ${warn.severity} | ${warn.description} |\n`;
      });
    }
    
    if (isFilterOrSortActive) {
      markdown += `
## Filters Applied

- **Search Query**: ${searchQuery || 'None'}
- **Type Filter**: ${typeFilter || 'None'}
- **Complexity Filter**: ${complexityFilter || 'None'}
- **Sort By**: ${sortBy} (${sortOrder})
`;
    }
    
    markdown += `
---
*Generated by CinePilot on ${new Date().toLocaleString()}*
`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vfx-breakdown-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [vfxNotes, vfxWarnings, filteredNotes, summary, selectedScript, scripts, isFilterOrSortActive, searchQuery, typeFilter, complexityFilter, sortBy, sortOrder]);

  // Ref for keyboard shortcut
  const exportToMarkdownRef = useRef(() => {});
  useEffect(() => {
    exportToMarkdownRef.current = exportToMarkdown;
  }, [exportToMarkdown]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">VFX Breakdown</h1>
                {isUsingDemo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Demo Data
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Scene-by-scene visual effects requirements and complexity analysis
              </p>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs">?</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[240px]"
            >
              <option value="">Select a script...</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            <button
              onClick={runAnalysis}
              disabled={!selectedScript || analyzing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Wand2 className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Run VFX Analysis'}
            </button>

            <button
              onClick={openAddForm}
              disabled={!selectedScript}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add VFX Shot
            </button>

            {vfxNotes.length > 0 && (
              <>
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showExportMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden min-w-[160px]">
                      <button
                        onClick={exportToCSV}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-400" />
                        Export CSV
                      </button>
                      <button
                        onClick={exportToJSON}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <FileJson className="w-4 h-4 text-purple-400" />
                        Export JSON
                      </button>
                      <button
                        onClick={() => { exportToMarkdown(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" />
                        Export Markdown
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative" ref={printMenuRef}>
                  <button
                    onClick={() => setShowPrintMenu(prev => !prev)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                    <ChevronDown className={`w-3 h-3 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showPrintMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden min-w-[180px]">
                      <button
                        onClick={printVfxReport}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <Printer className="w-4 h-4 text-purple-400" />
                        Print VFX Report
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fetchVfxData(selectedScript)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Toggle */}
        {vfxNotes.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
              />
            </div>
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Toggle Filters (F)"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">{activeFilterCount}</span>
              )}
            </button>
            <span className="text-xs text-slate-500 ml-auto">
              {filteredNotes.length} of {vfxNotes.length} notes
            </span>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && vfxNotes.length > 0 && (
          <div
            ref={filterPanelRef}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Filters:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Types</option>
                  {VFX_CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Complexity:</label>
                <select
                  value={complexityFilter}
                  onChange={(e) => setComplexityFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Complexity</option>
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                </select>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={toggleSortOrder}
                  className={`p-1.5 rounded-lg transition-colors ${
                    sortOrder === 'asc'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-purple-600/20 text-purple-300'
                  }`}
                  title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortOrder === 'asc' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Add/Edit Note Modal */}
        {showNoteForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  {editingNote ? 'Edit VFX Shot' : 'Add VFX Shot'}
                </h3>
                <button
                  onClick={() => { setShowNoteForm(false); resetForm(); }}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Scene Number</label>
                  <input
                    type="text"
                    value={formData.sceneNumber}
                    onChange={(e) => setFormData({ ...formData, sceneNumber: e.target.value })}
                    placeholder="e.g., 12"
                    className={`w-full bg-slate-800 border ${formErrors.sceneNumber ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  {formErrors.sceneNumber && <p className="text-red-400 text-xs mt-1">{formErrors.sceneNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the VFX requirements..."
                    rows={3}
                    className={`w-full bg-slate-800 border ${formErrors.description ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                  />
                  {formErrors.description && <p className="text-red-400 text-xs mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">VFX Type</label>
                  <select
                    value={formData.vfxType}
                    onChange={(e) => setFormData({ ...formData, vfxType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {VFX_CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Confidence ({formData.confidence}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.confidence}
                      onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                    {formErrors.confidence && <p className="text-red-400 text-xs mt-1">{formErrors.confidence}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
                      className={`w-full bg-slate-800 border ${formErrors.estimatedDuration ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {formErrors.estimatedDuration && <p className="text-red-400 text-xs mt-1">{formErrors.estimatedDuration}</p>}
                  </div>
                </div>

                {/* Complexity Preview */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Calculated Complexity:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityStyle(getComplexity(formData.confidence / 100)).bg} ${getComplexityStyle(getComplexity(formData.confidence / 100)).text}`}>
                      {getComplexity(formData.confidence / 100)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800">
                <button
                  onClick={() => { setShowNoteForm(false); resetForm(); }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingNote ? 'Update' : 'Add'} Shot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">VFX Scenes</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalScenes}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">VFX Notes</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalNotes}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-300">Est. Budget</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.estimatedTotalCost)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Est. Duration</span>
                </div>
                <div className="text-2xl font-bold">{formatDuration(summary.estimatedTotalDuration)}</div>
              </div>
              {/* Budget Tracking Card */}
              <div className={`bg-slate-900 border rounded-xl p-4 ${
                budgetStatus === 'over' ? 'border-red-500/50 bg-red-900/20' :
                budgetStatus === 'warning' ? 'border-amber-500/50 bg-amber-900/20' :
                'border-emerald-500/30 bg-emerald-900/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-4 h-4 ${
                      budgetStatus === 'over' ? 'text-red-400' :
                      budgetStatus === 'warning' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`} />
                    <span className={`text-xs ${
                      budgetStatus === 'over' ? 'text-red-300' :
                      budgetStatus === 'warning' ? 'text-amber-300' :
                      'text-emerald-300'
                    }`}>Budget Limit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {budgetStatus === 'over' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : budgetStatus === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                {/* Budget Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{budgetUsedPercent}% used</span>
                    <span className={
                      budgetStatus === 'over' ? 'text-red-400' :
                      budgetStatus === 'warning' ? 'text-amber-400' :
                      'text-emerald-400'
                    }>{budgetRemaining >= 0 ? formatCurrency(budgetRemaining) : `-${formatCurrency(Math.abs(budgetRemaining))}`} remaining</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      budgetStatus === 'over' ? 'bg-red-500' :
                      budgetStatus === 'warning' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }} />
                  </div>
                </div>
                {/* Budget Limit Input */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Set Limit:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(Number(e.target.value))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                {/* Status Message */}
                {budgetStatus === 'over' && (
                  <p className="text-xs text-red-400 mt-2">
                    ⚠️ Over budget by {formatCurrency(Math.abs(budgetRemaining))}
                  </p>
                )}
                {budgetStatus === 'warning' && budgetRemaining >= 0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    ⚠️ Approaching budget limit ({budgetUsedPercent}%)
                  </p>
                )}
                {budgetStatus === 'ok' && budgetRemaining > 0 && (
                  <p className="text-xs text-emerald-400 mt-2">
                    ✓ Within budget
                  </p>
                )}
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Warnings</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalWarnings}</div>
              </div>
              {(['simple', 'moderate', 'complex'] as const).map((level) => {
                const count = summary.complexityBreakdown[level];
                const style = getComplexityStyle(level);
                return (
                  <div
                    key={level}
                    className={`${style.bg} border ${style.border} rounded-xl p-4`}
                  >
                    <div className="text-xs text-slate-400 mb-2 capitalize">{level}</div>
                    <div className={`text-2xl font-bold ${style.text}`}>{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-800 pb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('scenes')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === 'scenes'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scenes
              </button>
              <button
                onClick={() => setActiveTab('cost')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === 'cost'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cost Analysis
              </button>
              <button
                onClick={() => setActiveTab('conflicts')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors relative ${
                  activeTab === 'conflicts'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conflicts
                {conflictStats.high > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                    {conflictStats.high}
                  </span>
                )}
              </button>
            </div>

            {/* Visualization Charts */}
            {vfxNotes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Complexity Distribution Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Complexity Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Simple', value: summary.complexityBreakdown.simple },
                            { name: 'Moderate', value: summary.complexityBreakdown.moderate },
                            { name: 'Complex', value: summary.complexityBreakdown.complex },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1, 2].map((index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Scene Complexity Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Scene Complexity
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayScenes.map(([sceneNum, group]) => {
                          const maxConf = Math.max(...group.notes.map(n => n.confidence), 0);
                          return {
                            scene: `S${sceneNum}`,
                            confidence: Math.round(maxConf * 100),
                            complexity: getComplexity(maxConf),
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="scene" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(value: number) => [`${value}%`, 'Confidence']}
                        />
                        <Bar dataKey="confidence" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Estimated Cost by Scene */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Estimated VFX Cost by Scene
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayScenes.map(([sceneNum, group]) => {
                          const avgConfidence = group.notes.length > 0
                            ? group.notes.reduce((sum, n) => sum + n.confidence, 0) / group.notes.length
                            : 0;
                          const complexity = getComplexity(avgConfidence);
                          const costPerSecond = VFX_COST_PER_SECOND[complexity as keyof typeof VFX_COST_PER_SECOND] || VFX_COST_PER_SECOND.simple;
                          const avgDuration = group.notes.length > 0
                            ? group.notes.reduce((sum, n) => sum + (n.estimatedDuration || 10), 0) / group.notes.length
                            : 10;
                          const estimatedCost = costPerSecond * avgDuration;
                          return {
                            scene: `S${sceneNum}`,
                            cost: Math.round(estimatedCost / 1000),
                            complexity,
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="scene" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v}K`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'cost') return [`₹${value}K`, 'Est. Cost'];
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="text-center py-12 text-slate-400">Loading VFX data...</div>
        )}

        {!loading && selectedScript && displayScenes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No VFX data found. Run a VFX analysis to scan this script.
          </div>
        )}

        {/* Tab Content */}
        {displayScenes.length > 0 && activeTab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              Scene-by-Scene Breakdown
            </h2>
            {displayScenes.map(([sceneNumber, group]) => {
              const maxConfidence = Math.max(
                ...group.notes.map((n) => n.confidence),
                0,
              );
              const complexity = getComplexity(maxConfidence);
              const compStyle = getComplexityStyle(complexity);

              return (
                <div
                  key={sceneNumber}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-400">
                        Scene {sceneNumber}
                      </span>
                      {group.heading && (
                        <span className="text-sm text-slate-300">{group.heading}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${compStyle.bg} ${compStyle.text} border ${compStyle.border}`}
                    >
                      {complexity}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {group.notes.map((note) => (
                      <div key={note.id} className="flex items-start gap-3 group">
                        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{note.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">
                              {note.vfxType === 'explicit' ? 'Explicit' : 'Implied'}
                            </span>
                            <span className="text-xs text-slate-600">
                              Confidence: {Math.round(note.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditForm(note)}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 hover:bg-red-900/50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {group.warnings.map((warn) => (
                      <div key={warn.id} className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{warn.description}</p>
                          <span className="text-xs text-amber-500 mt-1 inline-block">
                            {warn.severity}
                          </span>
                        </div>
                      </div>
                    ))}

                    {group.props.map((prop) => (
                      <div key={prop.id} className="flex items-start gap-3">
                        <Wand2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{prop.prop.name}</p>
                          {prop.prop.description && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {prop.prop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cost Analysis Tab */}
        {displayScenes.length > 0 && activeTab === 'cost' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 border border-emerald-500/30 rounded-xl p-6">
                <div className="text-sm text-emerald-400 mb-2">Total Estimated Cost</div>
                <div className="text-4xl font-bold text-emerald-400">{formatCurrency(summary.estimatedTotalCost)}</div>
                <div className="text-sm text-emerald-400/60 mt-2">Based on complexity analysis</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Average Cost per Shot</div>
                <div className="text-4xl font-bold text-white">{formatCurrency(Math.round(summary.estimatedTotalCost / summary.totalNotes))}</div>
                <div className="text-sm text-slate-500 mt-2">Per VFX shot</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Estimated Duration</div>
                <div className="text-4xl font-bold text-white">{formatDuration(summary.estimatedTotalDuration)}</div>
                <div className="text-sm text-slate-500 mt-2">Render time</div>
              </div>
            </div>

            {/* Cost by Scene Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Cost by Scene</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={displayScenes.map(([sceneNum, group]) => {
                      const cost = group.notes.reduce((sum, n) => {
                        const comp = getComplexity(n.confidence);
                        return sum + VFX_COST_PER_SECOND[comp as keyof typeof VFX_COST_PER_SECOND] * (n.estimatedDuration || 30);
                      }, 0);
                      return { scene: `S${sceneNum}`, cost: cost / 100000 };
                    })}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="scene" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value * 100000), 'Cost']}
                    />
                    <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Cost Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Scene</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Shots</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Complexity</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Est. Duration</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayScenes.map(([sceneNum, group]) => {
                      const maxConf = Math.max(...group.notes.map(n => n.confidence), 0);
                      const complexity = getComplexity(maxConf);
                      const compStyle = getComplexityStyle(complexity);
                      const totalDuration = group.notes.reduce((sum, n) => sum + (n.estimatedDuration || 30), 0);
                      const totalCost = group.notes.reduce((sum, n) => {
                        const comp = getComplexity(n.confidence);
                        return sum + VFX_COST_PER_SECOND[comp as keyof typeof VFX_COST_PER_SECOND] * (n.estimatedDuration || 30);
                      }, 0);

                      return (
                        <tr key={sceneNum} className="border-b border-slate-800">
                          <td className="py-3 px-4 text-sm">Scene {sceneNum}</td>
                          <td className="py-3 px-4 text-sm text-slate-400">{group.notes.length}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${compStyle.bg} ${compStyle.text}`}>{complexity}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400 text-right">{formatDuration(totalDuration)}</td>
                          <td className="py-3 px-4 text-sm text-emerald-400 text-right font-medium">{formatCurrency(totalCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800/50">
                      <td className="py-4 px-4 font-semibold">Total</td>
                      <td className="py-4 px-4 text-slate-400">{summary.totalNotes} shots</td>
                      <td className="py-4 px-4"></td>
                      <td className="py-4 px-4 text-slate-400 text-right">{formatDuration(summary.estimatedTotalDuration)}</td>
                      <td className="py-4 px-4 text-emerald-400 text-right font-bold text-lg">{formatCurrency(summary.estimatedTotalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Conflicts Tab */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6">
            {/* Conflict Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Total Conflicts</div>
                <div className="text-3xl font-bold text-white">{conflictStats.total}</div>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <div className="text-sm text-red-400 mb-1">High Priority</div>
                <div className="text-3xl font-bold text-red-400">{conflictStats.high}</div>
              </div>
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
                <div className="text-sm text-amber-400 mb-1">Medium Priority</div>
                <div className="text-3xl font-bold text-amber-400">{conflictStats.medium}</div>
              </div>
              <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Low Priority</div>
                <div className="text-3xl font-bold text-slate-400">{conflictStats.low}</div>
              </div>
            </div>

            {/* All Clear State */}
            {vfxConflicts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">VFX Plan Looks Good!</h3>
                <p className="text-slate-400">No conflicts detected. Your VFX shots are within budget and timeline.</p>
              </div>
            ) : (
              /* Conflict Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vfxConflicts.map((conflict) => {
                  const severityStyles = {
                    high: { bg: 'bg-red-900/20', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500' },
                    medium: { bg: 'bg-amber-900/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500' },
                    low: { bg: 'bg-slate-800/30', border: 'border-slate-600/30', text: 'text-slate-400', badge: 'bg-slate-500' },
                  };
                  const typeIcons = {
                    budget: <DollarSign className="w-5 h-5" />,
                    certification: <Shield className="w-5 h-5" />,
                    complexity: <AlertTriangle className="w-5 h-5" />,
                    timeline: <Clock className="w-5 h-5" />,
                    technical: <Wand2 className="w-5 h-5" />,
                  };
                  const typeLabels = {
                    budget: 'Budget',
                    certification: 'Certification',
                    complexity: 'Complexity',
                    timeline: 'Timeline',
                    technical: 'Technical',
                  };
                  const style = severityStyles[conflict.severity];

                  return (
                    <div key={conflict.id} className={`${style.bg} border ${style.border} rounded-xl p-5`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`${style.text}`}>
                            {typeIcons[conflict.type]}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                            {typeLabels[conflict.type]}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${style.badge}`}>
                          {conflict.severity.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="text-lg font-semibold text-white mb-2">{conflict.title}</h4>

                      {conflict.scene && (
                        <div className="text-sm text-slate-400 mb-2">
                          <span className="text-slate-500">Scene:</span> {conflict.scene}
                        </div>
                      )}

                      <p className="text-sm text-slate-300 mb-3">{conflict.description}</p>

                      {conflict.recommendation && (
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                          <div className="text-xs text-purple-400 font-medium mb-1">Recommendation</div>
                          <p className="text-sm text-slate-300">{conflict.recommendation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Conflict Summary by Type */}
            {vfxConflicts.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Conflicts by Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { type: 'budget', label: 'Budget', icon: DollarSign, count: vfxConflicts.filter(c => c.type === 'budget').length },
                    { type: 'certification', label: 'Certification', icon: Shield, count: vfxConflicts.filter(c => c.type === 'certification').length },
                    { type: 'complexity', label: 'Complexity', icon: AlertTriangle, count: vfxConflicts.filter(c => c.type === 'complexity').length },
                    { type: 'timeline', label: 'Timeline', icon: Clock, count: vfxConflicts.filter(c => c.type === 'timeline').length },
                    { type: 'technical', label: 'Technical', icon: Wand2, count: vfxConflicts.filter(c => c.type === 'technical').length },
                  ].map(({ type, label, icon: Icon, count }) => (
                    <div key={type} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                      <Icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{count}</div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  Keyboard Shortcuts
                </h2>
                <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {/* When filters panel CLOSED */}
                <div className="text-xs font-medium text-amber-400 mt-3 mb-1">When filters panel CLOSED:</div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Refresh data</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">R</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Search notes</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">/</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Toggle filters</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">F</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Clear all filters (when open)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-amber-400">X</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Toggle sort order</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">S</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Add new VFX shot</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">N</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Export data</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">E</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Export as Markdown</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">M</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Print VFX report</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">P</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Overview tab</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">1</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Scenes tab</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">2</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Cost Analysis tab</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">3</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Conflicts tab</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">4</kbd>
                </div>
                
                {/* When filters panel OPEN */}
                <div className="text-xs font-medium text-cyan-400 mt-3 mb-1">When filters panel OPEN:</div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: CGI (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">1</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Compositing (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">2</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Wire Removal (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">3</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Matte Painting (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">4</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Simulation (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">5</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Enhancement (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">6</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Explicit VFX (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">7</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Implied VFX (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">8</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Clear type filter</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">0</kbd>
                </div>
                
                {/* Complexity filters with Shift */}
                <div className="text-xs font-medium text-emerald-400 mt-3 mb-1">Complexity filters (Shift+key):</div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Simple (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Shift+1</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Moderate (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Shift+2</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Filter: Complex (toggle)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Shift+3</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Clear complexity filter</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Shift+0</kbd>
                </div>
                
                {/* General shortcuts */}
                <div className="text-xs font-medium text-slate-400 mt-3 mb-1">General:</div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">?</kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300">Close / Clear</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
