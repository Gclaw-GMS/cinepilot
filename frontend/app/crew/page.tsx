'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Pencil,
  Trash2,
  X,
  DollarSign,
  Briefcase,
  Download,
  Filter,
  BarChart3,
  UsersRound,
  AlertCircle,
  CheckCircle,
  Check,
  TrendingUp,
  Keyboard,
  RefreshCw,
  ChevronDown,
  FileText,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const DEPARTMENTS = [
  'Camera',
  'Lighting',
  'Sound',
  'Art',
  'Makeup',
  'Costume',
  'Direction',
  'Production',
  'VFX',
  'Stunts',
] as const;

const DEPT_COLORS: Record<string, string> = {
  Camera: '#3b82f6',
  Lighting: '#f59e0b',
  Sound: '#8b5cf6',
  Art: '#10b981',
  Makeup: '#ec4899',
  Costume: '#f97316',
  Direction: '#6366f1',
  Production: '#14b8a6',
  VFX: '#ef4444',
  Stunts: '#84cc16',
};

type CrewMember = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  dailyRate: string | number | null;
  notes: string | null;
  skills?: string[];
  createdAt: string;
};

const DEMO_CREW: CrewMember[] = [
  { id: '1', name: 'Ravi Kumar', role: 'Director of Photography', department: 'Camera', phone: '+91 98765 43210', email: 'ravi@cinepilot.ai', dailyRate: '25000', notes: 'Award-winning cinematographer with 15+ years experience', skills: ['ARRI', 'RED', 'Drone Cinematography', 'Steadicam'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Priya Venkatesh', role: 'Director', department: 'Direction', phone: '+91 98765 43211', email: 'priya@cinepilot.ai', dailyRate: '50000', notes: 'National Award winning director', skills: ['Script Breakdown', 'Actor Coaching', 'Montage'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '3', name: 'Arun Raj', role: 'Sound Engineer', department: 'Sound', phone: '+91 98765 43212', email: 'arun@cinepilot.ai', dailyRate: '15000', notes: 'Specialist in outdoor location sound', skills: ['Boom Operation', 'Location Mixing', 'ADR'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '4', name: 'Madhavan S', role: 'Gaffer', department: 'Lighting', phone: '+91 98765 43213', email: 'madhavan@cinepilot.ai', dailyRate: '12000', notes: 'Expert in LED and traditional lighting setups', skills: ['LED Walls', 'Grip Equipment', 'Color Theory'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '5', name: 'Lakshmi Narayanan', role: 'Production Designer', department: 'Art', phone: '+91 98765 43214', email: 'lakshmi@cinepilot.ai', dailyRate: '20000', notes: 'Specializes in period dramas', skills: ['Set Design', 'Prop Management', 'Period Research'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '6', name: 'Karthik R', role: 'Makeup Artist', department: 'Makeup', phone: '+91 98765 43215', email: 'karthik@cinepilot.ai', dailyRate: '10000', notes: 'Prosthetics and special effects makeup expert', skills: ['Prosthetics', 'SFX Makeup', 'HD Makeup'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '7', name: 'Samantha R', role: 'Costume Designer', department: 'Costume', phone: '+91 98765 43216', email: 'samantha@cinepilot.ai', dailyRate: '18000', notes: 'Contemporary and traditional South Indian costumes', skills: ['Traditional wear', 'Modern Fashion', 'Jewelry Design'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '8', name: 'Vijay B', role: 'Editor', department: 'Production', phone: '+91 98765 43217', email: 'vijay@cinepilot.ai', dailyRate: '22000', notes: 'Known for fast-paced action sequences', skills: ['Action Editing', 'Color Grading', 'Sound Design'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '9', name: 'Anand Prakash', role: 'VFX Supervisor', department: 'VFX', phone: '+91 98765 43218', email: 'anand@cinepilot.ai', dailyRate: '35000', notes: 'Specialist in CGI and compositing', skills: ['Compositing', 'CGI', 'Motion Graphics'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '10', name: 'Bala Subramani', role: 'Stunt Choreographer', department: 'Stunts', phone: '+91 98765 43219', email: 'bala@cinepilot.ai', dailyRate: '28000', notes: 'International stunt coordination experience', skills: ['Car Stunts', 'Fight Choreography', 'Wire Work'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '11', name: 'Divya K', role: 'Assistant Director', department: 'Direction', phone: '+91 98765 43220', email: 'divya@cinepilot.ai', dailyRate: '8000', notes: 'Assisted on 10+ major Tamil films', skills: ['Scheduling', 'Call Sheets', 'Location Scouting'], createdAt: '2024-01-15T10:00:00Z' },
  { id: '12', name: 'Ramesh T', role: 'Camera Operator', department: 'Camera', phone: '+91 98765 43221', email: 'ramesh@cinepilot.ai', dailyRate: '9000', notes: 'Steadicam and gimbal specialist', skills: ['Steadicam', 'Gimbal', 'Sports Coverage'], createdAt: '2024-01-15T10:00:00Z' },
];

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate active filter count
  const activeFilterCount = deptFilter !== 'all' ? 1 : 0;

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const fetchDataRef = useRef<() => void | Promise<void>>();
  const handlePrintRef = useRef<() => void>();
  const selectAllCrewRef = useRef<() => void>(() => {});
  const clearSelectionRef = useRef<() => void>(() => {});

  const [form, setForm] = useState({
    name: '',
    role: '',
    department: '',
    phone: '',
    email: '',
    dailyRate: '',
    notes: '',
  });

  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'department' | 'dailyRate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'skills'>('list');

  // Bulk selection state
  const [selectedCrew, setSelectedCrew] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedCrewRef = useRef(selectedCrew);
  const bulkActionsRef = useRef<HTMLDivElement>(null);

  // Sort options for UI
  const sortOptions = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'dailyRate', label: 'Daily Rate' },
  ];

  // View mode options
  const viewModeOptions = [
    { key: 'list', label: 'List View', icon: Users },
    { key: 'skills', label: 'Skills Matrix', icon: Briefcase },
  ];

  // Bulk selection handlers
  const toggleSelectCrew = useCallback((id: string) => {
    setSelectedCrew(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const fetchCrew = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crew');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const isDemo = Array.isArray(data) && data.length > 0 && data[0]?.id?.startsWith('crew-');
      setIsDemoMode(isDemo);
      setCrew(data);
      setError(null);
    } catch (err) {
      console.warn('Using demo crew data:', err);
      setCrew(DEMO_CREW);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  // Set up fetch data ref for keyboard shortcut
  useEffect(() => {
    fetchDataRef.current = async () => {
      setIsRefreshing(true)
      await fetchCrew()
      setIsRefreshing(false)
    }
  }, [fetchCrew])

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
          if (!modalOpen) {
            setModalOpen(true)
            setEditingId(null)
            setForm({ name: '', role: '', department: '', phone: '', email: '', dailyRate: '', notes: '' })
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
          setShowDeleteConfirm(false)
          setSearch('')
          setDeptFilter('all')
          // Clear bulk selection when pressing Esc
          if (selectedCrewRef.current.size > 0) {
            clearSelectionRef.current()
          }
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(prev => !prev)
          break
        case 'p':
          e.preventDefault()
          handlePrintRef.current?.()
          break
        case 'v':
          e.preventDefault()
          setViewMode(prev => prev === 'list' ? 'skills' : 'list')
          break
        case '1':
          e.preventDefault()
          setViewMode('list')
          break
        case '2':
          e.preventDefault()
          setViewMode('skills')
          break
        case 'a':
          // Ctrl+A or Cmd+A for select all
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            selectAllCrewRef.current()
          }
          break
        case 'd':
          // Ctrl+D or Cmd+D for delete selected (when not in input)
          if ((e.ctrlKey || e.metaKey) && selectedCrewRef.current.size > 0) {
            e.preventDefault()
            setShowDeleteConfirm(true)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen])

  const filtered = useMemo(() => {
    const filteredCrew = crew.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
        (c.department && c.department.toLowerCase().includes(search.toLowerCase()));
      const matchDept = deptFilter === 'all' || c.department === deptFilter;
      return matchSearch && matchDept;
    });
    
    // Apply sorting
    return filteredCrew.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '');
          break;
        case 'department':
          comparison = (a.department || '').localeCompare(b.department || '');
          break;
        case 'dailyRate':
          const aRate = a.dailyRate ? (typeof a.dailyRate === 'string' ? parseFloat(a.dailyRate) : Number(a.dailyRate)) : 0;
          const bRate = b.dailyRate ? (typeof b.dailyRate === 'string' ? parseFloat(b.dailyRate) : Number(b.dailyRate)) : 0;
          comparison = aRate - bRate;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [crew, search, deptFilter, sortBy, sortOrder]);

  // Bulk selection handlers (defined after filtered to avoid reference errors)
  const selectAllCrew = useCallback(() => {
    setSelectedCrew(new Set(filtered.map(c => c.id)));
  }, [filtered]);

  const clearSelection = useCallback(() => {
    setSelectedCrew(new Set());
    setShowBulkActions(false);
  }, []);

  // Update refs for keyboard shortcuts
  useEffect(() => {
    selectAllCrewRef.current = selectAllCrew;
  }, [selectAllCrew]);

  useEffect(() => {
    clearSelectionRef.current = clearSelection;
  }, [clearSelection]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCrew.size === 0) return;
    
    try {
      const idsToDelete = Array.from(selectedCrew);
      // Delete each selected crew member
      await Promise.all(
        idsToDelete.map(async (id) => {
          await fetch(`/api/crew?id=${id}`, { method: 'DELETE' });
        })
      );
      setSuccess(`Successfully deleted ${idsToDelete.length} crew member(s)`);
      setSelectedCrew(new Set());
      setShowBulkActions(false);
      setShowDeleteConfirm(false);
      fetchCrew();
    } catch (err) {
      setError('Failed to delete selected crew');
    }
  }, [selectedCrew, fetchCrew]);

  // Update selectedCrew ref
  useEffect(() => {
    selectedCrewRef.current = selectedCrew;
    if (selectedCrew.size > 0) {
      setShowBulkActions(true);
    } else {
      setShowBulkActions(false);
    }
  }, [selectedCrew]);

  const formatINR = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const stats = useMemo(() => {
    const total = crew.length;
    const deptCounts = crew.reduce<Record<string, number>>((acc, c) => {
      const d = c.department || 'Unassigned';
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});
    
    const totalDailyRate = crew.reduce((sum, c) => {
      const rate = c.dailyRate ? (typeof c.dailyRate === 'string' ? parseFloat(c.dailyRate) : Number(c.dailyRate)) : 0;
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);
    
    const avgDailyRate = total > 0 ? totalDailyRate / total : 0;
    const projected30Day = totalDailyRate * 30; // 30-day production cost projection
    
    return { total, deptCounts, totalDailyRate, avgDailyRate, projected30Day, departments: Object.keys(deptCounts).length };
  }, [crew]);

  const deptData = useMemo(() => {
    return DEPARTMENTS.map(dept => ({
      name: dept,
      value: stats.deptCounts[dept] || 0,
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [stats.deptCounts]);

  const rateData = useMemo(() => {
    return DEPARTMENTS.map(dept => ({
      name: dept,
      rate: crew.filter(c => c.department === dept).reduce((sum, c) => {
        const r = c.dailyRate ? (typeof c.dailyRate === 'string' ? parseFloat(c.dailyRate) : Number(c.dailyRate)) : 0;
        return sum + (isNaN(r) ? 0 : r);
      }, 0) / 1000,
    })).filter(d => d.rate > 0).sort((a, b) => b.rate - a.rate);
  }, [crew]);

  // Skills Matrix data computation
  const skillsMatrix = useMemo(() => {
    // Extract all unique skills from crew
    const allSkills = new Set<string>();
    crew.forEach(c => {
      if (c.skills && Array.isArray(c.skills)) {
        c.skills.forEach(s => allSkills.add(s));
      }
    });
    const sortedSkills = Array.from(allSkills).sort();
    
    // Build matrix: crew member -> skills
    const matrix = crew.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      department: c.department || 'Unassigned',
      skills: c.skills || [],
      hasSkill: (skill: string) => (c.skills || []).includes(skill),
    }));
    
    return { skills: sortedSkills, matrix };
  }, [crew]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: '', role: '', department: '', phone: '', email: '', dailyRate: '', notes: '' });
    setModalOpen(true);
  };

  const openEditModal = (member: CrewMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      department: member.department || '',
      phone: member.phone || '',
      email: member.email || '',
      dailyRate: member.dailyRate ? String(member.dailyRate) : '',
      notes: member.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
    setForm({ name: '', role: '', department: '', phone: '', email: '', dailyRate: '', notes: '' });
  };

  // Field-specific validation
  const validateForm = (): string | null => {
    const errors: Record<string, string> = {};
    let firstError: string | null = null;
    
    if (!form.name.trim()) {
      errors.name = 'Name is required';
      firstError = firstError || errors.name;
    }
    if (!form.role.trim()) {
      errors.role = 'Role is required';
      firstError = firstError || errors.role;
    }
    
    // Validate email format if provided
    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        errors.email = 'Invalid email format';
        firstError = firstError || errors.email;
      }
    }
    
    // Validate phone format if provided (accepts various formats)
    if (form.phone.trim()) {
      const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
      if (!phoneRegex.test(form.phone.trim())) {
        errors.phone = 'Invalid phone number';
        firstError = firstError || errors.phone;
      }
    }
    
    // Validate daily rate if provided
    if (form.dailyRate.trim()) {
      const rate = parseFloat(form.dailyRate);
      if (isNaN(rate) || rate < 0) {
        errors.dailyRate = 'Must be a positive number';
        firstError = firstError || errors.dailyRate;
      }
    }
    
    setFieldErrors(errors);
    return firstError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Run validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId 
        ? { id: editingId, ...form, dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : null }
        : { ...form, dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : null };

      const res = await fetch('/api/crew', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setSuccess(editingId ? 'Crew member updated!' : 'Crew member added!');
      setTimeout(() => setSuccess(null), 3000);
      closeModal();
      await fetchCrew();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this crew member?')) return;
    
    setError(null);
    try {
      const res = await fetch('/api/crew', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setSuccess('Crew member removed');
      setTimeout(() => setSuccess(null), 3000);
      await fetchCrew();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
    }
  };

  // Click outside to close export menu, print menu, and filter panel
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
    if (showExportMenu || showPrintMenu || showFilters) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu, showPrintMenu, showFilters])

  const handleExportCSV = () => {
    setExporting(true)
    const headers = ['Name', 'Role', 'Department', 'Phone', 'Email', 'Daily Rate', 'Notes'];
    const rows = filtered.map(c => [
      c.name,
      c.role,
      c.department || '',
      c.phone || '',
      c.email || '',
      String(c.dailyRate || ''),
      c.notes || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crew-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false)
    setExporting(false)
    setSuccess('Crew exported to CSV!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleExportJSON = () => {
    setExporting(true)
    const totalDailyRate = crew.reduce((sum, c) => {
      const rate = c.dailyRate ? (typeof c.dailyRate === 'string' ? parseFloat(c.dailyRate) : Number(c.dailyRate)) : 0
      return sum + (isNaN(rate) ? 0 : rate)
    }, 0)

    const exportData = {
      exportDate: new Date().toISOString(),
      projectId: 'demo',
      summary: {
        totalCrew: crew.length,
        totalDailyRate: totalDailyRate,
        departments: [...new Set(crew.map(c => c.department).filter(Boolean))].length,
      },
      crew: crew.map(c => ({
        name: c.name,
        role: c.role,
        department: c.department || '',
        phone: c.phone || '',
        email: c.email || '',
        dailyRate: c.dailyRate,
        notes: c.notes || '',
        createdAt: c.createdAt,
      })),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crew-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    setShowExportMenu(false)
    setExporting(false)
    setSuccess('Crew exported to JSON!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handlePrint = useCallback(() => {
    const totalDailyRate = crew.reduce((sum, c) => {
      const rate = c.dailyRate ? (typeof c.dailyRate === 'string' ? parseFloat(c.dailyRate) : Number(c.dailyRate)) : 0
      return sum + (isNaN(rate) ? 0 : rate)
    }, 0)

    const deptCounts = crew.reduce<Record<string, number>>((acc, c) => {
      const d = c.department || 'Unassigned'
      acc[d] = (acc[d] ?? 0) + 1
      return acc
    }, {})

    const statsHtml = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1a1a2e;">Summary Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div><strong>Total Crew:</strong> ${crew.length}</div>
          <div><strong>Total Daily Rate:</strong> ₹${totalDailyRate.toLocaleString('en-IN')}</div>
          <div><strong>Departments:</strong> ${Object.keys(deptCounts).length}</div>
          <div><strong>Avg Rate:</strong> ₹${(totalDailyRate / crew.length || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div style="margin-bottom: 20px; padding: 10px; background: #f0fdf4; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #166534;">Department Breakdown</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${Object.entries(deptCounts).map(([dept, count]) => 
            `<span style="background: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: 1px solid #e5e7eb;">${dept}: ${count}</span>`
          ).join('')}
        </div>
      </div>
    `
    
    const tableRows = filtered.map((c, i) => `
      <tr style="${i % 2 === 0 ? 'background: #f9fafb;' : ''}">
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>${c.name}</strong></td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.role}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;"><span style="background: ${DEPT_COLORS[c.department || 'Unassigned'] || '#64748b'}20; color: ${DEPT_COLORS[c.department || 'Unassigned'] || '#64748b'}; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${c.department || 'Unassigned'}</span></td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.phone || '-'}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.email || '-'}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${c.dailyRate ? '₹' + Number(c.dailyRate).toLocaleString('en-IN') : '-'}</td>
      </tr>
    `).join('')

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Crew Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1 { color: #1a1a2e; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f8f9fa; font-weight: 600; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Crew Management Report</h1>
          <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
          ${statsHtml}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Email</th>
                <th style="text-align: right;">Daily Rate</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    printWindow.document.write(fullHtml)
    printWindow.document.close()
    printWindow.print()
    
    setShowPrintMenu(false)
  }, [crew, filtered])

  // Update handlePrint ref
  useEffect(() => {
    handlePrintRef.current = handlePrint
  }, [handlePrint])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading crew...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Crew Management</h1>
                {isDemoMode && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded font-medium">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">Manage your production crew and department assignments</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchDataRef.current?.()} 
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
                title="Refresh (R)"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setShowExportMenu(prev => !prev)}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
                  title="Export (E)"
                >
                  <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
                  Export
                  <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
              <div className="relative" ref={printMenuRef}>
                <button 
                  onClick={() => setShowPrintMenu(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                  title="Print (P)"
                >
                  <Printer className="w-4 h-4" />
                  Print
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-left"
                    >
                      <Printer className="w-4 h-4" />
                      Print Crew Report
                    </button>
                  </div>
                )}
              </div>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                {viewModeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = viewMode === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setViewMode(option.key as typeof viewMode)}
                      className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                        isActive 
                          ? 'bg-emerald-600 text-white' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      title={`${option.label} (${option.key === 'list' ? '1' : '2'})`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Crew
              </button>
              <button 
                onClick={() => setShowKeyboardHelp(true)} 
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-5 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <UsersRound className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">Total Crew</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">{stats.departments} departments</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-400">Daily Rate</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{formatINR(stats.totalDailyRate)}</p>
            <p className="text-xs text-slate-500 mt-1">Per day</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">Avg Rate</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{formatINR(stats.avgDailyRate)}</p>
            <p className="text-xs text-slate-500 mt-1">Per person</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Briefcase className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-sm text-slate-400">Departments</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{stats.departments}</p>
            <p className="text-xs text-slate-500 mt-1">Active</p>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-amber-400">30-Day Projection</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{formatINR(stats.projected30Day)}</p>
            <p className="text-xs text-slate-500 mt-1">Estimated total</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
            <div className="h-64">
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {deptData.map((entry) => (
                        <Cell key={entry.name} fill={DEPT_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value: number) => [`${value} members`, '']} />
                    <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No crew data yet</div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Cost by Department (₹K)</h3>
            <div className="h-64">
              {rateData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rateData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}K`} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value: number) => [`₹${(value * 1000).toLocaleString('en-IN')}`, 'Daily Cost']} />
                    <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} name="Daily Cost (₹K)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No rate data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search crew by name, role, or department... (/)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">(/)</span>
          </div>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
            title="Toggle Filters (F)"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{activeFilterCount}</span>
            )}
          </button>
          {/* Bulk Selection Controls */}
          {selectedCrew.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-400 font-medium">{selectedCrew.size} selected</span>
              <button
                onClick={clearSelection}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                title="Clear Selection (Esc)"
              >
                Clear
              </button>
            </div>
          ) : (
            <button
              onClick={selectAllCrew}
              disabled={filtered.length === 0}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2"
              title="Select All (Ctrl+A)"
            >
              <Check className="w-4 h-4" />
              Select All
            </button>
          )}
          <span className="text-sm text-slate-500">{filtered.length} of {crew.length}</span>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div 
            ref={filterPanelRef}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Filters:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Department:</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <button
                onClick={() => setDeptFilter('all')}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
              
              {/* Sort Controls */}
              <div className="flex items-center gap-2 ml-auto border-l border-slate-700 pl-4">
                <span className="text-sm text-slate-400">Sort:</span>
                <div className="flex gap-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSortBy(option.key as typeof sortBy)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        sortBy === option.key 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skills Matrix View */}
        {viewMode === 'skills' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Skills Matrix
              </h3>
              <p className="text-sm text-slate-400 mt-1">Visual overview of crew skills across all departments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-900">
                      Crew Member
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    {skillsMatrix.skills.map(skill => (
                      <th key={skill} className="text-center px-2 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[80px]">
                        <span className="transform -rotate-45 origin-center block" title={skill}>
                          {skill.length > 10 ? skill.substring(0, 10) + '...' : skill}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => (
                    <tr key={member.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium text-xs">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {member.department ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${DEPT_COLORS[member.department] || '#64748b'}20`, color: DEPT_COLORS[member.department] || '#94a3b8' }}>
                            {member.department}
                          </span>
                        ) : (<span className="text-slate-500 text-sm">—</span>)}
                      </td>
                      {skillsMatrix.skills.map(skill => {
                        const hasSkill = (member.skills || []).includes(skill);
                        return (
                          <td key={skill} className="text-center px-2 py-3">
                            {hasSkill ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {skillsMatrix.skills.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No skills data available. Add skills to crew members to see the matrix.
              </div>
            )}
          </div>
        )}

        {/* Crew Table */}
        {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCrew.size === filtered.length && filtered.length > 0}
                    onChange={() => selectedCrew.size === filtered.length ? clearSelection() : selectAllCrew()}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
                <th 
                  className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-400 transition-colors"
                  onClick={() => { setSortBy('name'); setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Name {sortBy === 'name' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th 
                  className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-400 transition-colors"
                  onClick={() => { setSortBy('role'); setSortOrder(sortBy === 'role' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Role {sortBy === 'role' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th 
                  className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-400 transition-colors"
                  onClick={() => { setSortBy('department'); setSortOrder(sortBy === 'department' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Department {sortBy === 'department' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Skills</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th 
                  className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-400 transition-colors"
                  onClick={() => { setSortBy('dailyRate'); setSortOrder(sortBy === 'dailyRate' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
                >
                  Daily Rate {sortBy === 'dailyRate' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="text-right w-24 px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No crew members found. Add your first crew member!
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id} className={`hover:bg-slate-800/50 transition-colors ${selectedCrew.has(member.id) ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCrew.has(member.id)}
                        onChange={() => toggleSelectCrew(member.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          {member.notes && (<p className="text-xs text-slate-500 truncate max-w-[200px]">{member.notes}</p>)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p className="text-slate-300">{member.role}</p></td>
                    <td className="px-6 py-4">
                      {member.department ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${DEPT_COLORS[member.department] || '#64748b'}20`, color: DEPT_COLORS[member.department] || '#94a3b8' }}>
                          {member.department}
                        </span>
                      ) : (<span className="text-slate-500 text-sm">—</span>)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.skills && member.skills.length > 0 ? (
                          member.skills.slice(0, 2).map((skill, i) => (
                            <span key={i} className="inline-flex px-1.5 py-0.5 bg-slate-800 text-slate-400 text-xs rounded">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                        {member.skills && member.skills.length > 2 && (
                          <span className="inline-flex px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                            +{member.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {member.phone && (<a href={`tel:${member.phone}`} className="flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400"><Phone className="w-3 h-3" />{member.phone}</a>)}
                        {member.email && (<a href={`mailto:${member.email}`} className="flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400"><Mail className="w-3 h-3" />{member.email}</a>)}
                        {!member.phone && !member.email && (<span className="text-slate-500 text-sm">—</span>)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><p className="font-medium text-emerald-400">{formatINR(member.dailyRate)}</p></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(member)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Floating Bulk Actions Toolbar */}
        {showBulkActions && selectedCrew.size > 0 && (
          <div 
            ref={bulkActionsRef}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 z-30 animate-in slide-in-from-bottom-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-white">{selectedCrew.size} selected</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Crew?</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">{selectedCrew.size}</span> selected crew member{selectedCrew.size > 1 ? 's' : ''}? This will permanently remove them from your crew list.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Delete {selectedCrew.size > 1 ? `${selectedCrew.size} Items` : 'Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Crew Member' : 'Add New Crew Member'}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors(prev => ({...prev, name: ''})); }}
                  className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-sm focus:ring-2 ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'}`} 
                  required 
                />
                {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Role *</label>
                <input 
                  type="text" 
                  value={form.role} 
                  onChange={(e) => { setForm({ ...form, role: e.target.value }); setFieldErrors(prev => ({...prev, role: ''})); }}
                  className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-sm focus:ring-2 ${fieldErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'}`} 
                  placeholder="e.g., Director of Photography" 
                  required 
                />
                {fieldErrors.role && <p className="text-red-400 text-xs mt-1">{fieldErrors.role}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={form.phone} 
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFieldErrors(prev => ({...prev, phone: ''})); }}
                    className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-sm focus:ring-2 ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'}`} 
                    placeholder="+91 98765 43210" 
                  />
                  {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors(prev => ({...prev, email: ''})); }}
                    className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-sm focus:ring-2 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'}`} 
                    placeholder="name@email.com" 
                  />
                  {fieldErrors.email && <p className="text-amber-400 text-xs mt-1">{fieldErrors.email}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Daily Rate (₹)</label>
                <input 
                  type="number" 
                  value={form.dailyRate} 
                  onChange={(e) => { setForm({ ...form, dailyRate: e.target.value }); setFieldErrors(prev => ({...prev, dailyRate: ''})); }}
                  className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-sm focus:ring-2 ${fieldErrors.dailyRate ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'}`} 
                  placeholder="25000" 
                  min="0" 
                />
                {fieldErrors.dailyRate && <p className="text-red-400 text-xs mt-1">{fieldErrors.dailyRate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" rows={3} placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">
                  {editingId ? 'Update' : 'Add Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Refresh crew data</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">R</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Search crew</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">/</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle filters</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">F</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Add new crew</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">N</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Export menu</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">E</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Print crew report</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">P</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Toggle view mode</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">V</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Select all (when list view)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Ctrl+A</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Delete selected</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Ctrl+D</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">List view</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Skills matrix view</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">?</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-300">Close / Clear selection</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
