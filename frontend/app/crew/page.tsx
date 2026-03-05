'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Calendar,
  Briefcase,
  TrendingUp,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Download,
  FileText,
  Keyboard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

type CrewMember = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  dailyRate: string | number | null;
  notes: string | null;
  createdAt: string;
};

const DEPT_COLORS: Record<string, string> = {
  Camera: '#6366f1',
  Lighting: '#f59e0b',
  Sound: '#10b981',
  Art: '#ec4899',
  Makeup: '#8b5cf6',
  Costume: '#14b8a6',
  Direction: '#ef4444',
  Production: '#3b82f6',
  VFX: '#f97316',
  Stunts: '#84cc16',
};

// Rich demo data to showcase all UI features
const DEMO_CREW: CrewMember[] = [
  { id: 'd1', name: 'Ravi Kumar', role: 'Director of Photography', department: 'Camera', phone: '+91 98765 43210', email: 'ravi@film.com', dailyRate: 75000, notes: 'Award-winning cinematographer', createdAt: '2026-01-15' },
  { id: 'd2', name: 'Anand Venkatesh', role: 'Gaffer', department: 'Lighting', phone: '+91 98765 43211', email: 'anand@film.com', dailyRate: 15000, notes: '15+ years experience', createdAt: '2026-01-15' },
  { id: 'd3', name: 'Vijay Raghavan', role: 'Sound Mixer', department: 'Sound', phone: '+91 98765 43212', email: 'vijay@film.com', dailyRate: 12000, notes: null, createdAt: '2026-01-15' },
  { id: 'd4', name: 'Madhan Kumar', role: 'Production Designer', department: 'Art', phone: '+91 98765 43213', email: 'madhan@film.com', dailyRate: 45000, notes: 'Specializes in period films', createdAt: '2026-01-16' },
  { id: 'd5', name: 'Lakshmi Devi', role: 'Chief Makeup Artist', department: 'Makeup', phone: '+91 98765 43214', email: 'lakshmi@film.com', dailyRate: 25000, notes: 'Nationally awarded', createdAt: '2026-01-16' },
  { id: 'd6', name: 'Vasantha Kumar', role: 'Costume Designer', department: 'Costume', phone: '+91 98765 43215', email: 'vasantha@film.com', dailyRate: 35000, notes: 'Authentic Tamil costumes', createdAt: '2026-01-16' },
  { id: 'd7', name: 'Kamal Haasan', role: 'Director', department: 'Direction', phone: '+91 98765 43216', email: 'kamal@film.com', dailyRate: 150000, notes: 'Visionary director', createdAt: '2026-01-10' },
  { id: 'd8', name: 'Rajesh Kumar', role: 'Line Producer', department: 'Production', phone: '+91 98765 43217', email: 'rajesh@film.com', dailyRate: 20000, notes: 'Expert in Tamil Nadu locations', createdAt: '2026-01-17' },
  { id: 'd9', name: 'Prakash Raj', role: 'VFX Supervisor', department: 'VFX', phone: '+91 98765 43218', email: 'prakash@film.com', dailyRate: 60000, notes: 'Hollywood-level VFX expertise', createdAt: '2026-01-17' },
  { id: 'd10', name: 'Bala Chandran', role: 'Stunt Choreographer', department: 'Stunts', phone: '+91 98765 43219', email: 'bala@film.com', dailyRate: 30000, notes: 'Master of action choreography', createdAt: '2026-01-18' },
  { id: 'd11', name: 'Arun Kumar', role: 'Camera Operator', department: 'Camera', phone: '+91 98765 43220', email: 'arun@film.com', dailyRate: 12000, notes: 'Steadicam specialist', createdAt: '2026-01-18' },
  { id: 'd12', name: 'Suresh Babu', role: 'Best Boy', department: 'Lighting', phone: '+91 98765 43221', email: 'suresh@film.com', dailyRate: 8000, notes: null, createdAt: '2026-01-18' },
  { id: 'd13', name: 'Ganesh Kumar', role: 'Production Manager', department: 'Production', phone: '+91 98765 43222', email: 'ganesh@film.com', dailyRate: 18000, notes: '10+ years in production', createdAt: '2026-01-19' },
  { id: 'd14', name: 'Saravanan', role: 'Focus Puller', department: 'Camera', phone: '+91 98765 43223', email: 'saravanan@film.com', dailyRate: 10000, notes: null, createdAt: '2026-01-19' },
  { id: 'd15', name: 'Divya Raman', role: 'Assistant Director', department: 'Direction', phone: '+91 98765 43224', email: 'divya@film.com', dailyRate: 15000, notes: 'Expert in schedule management', createdAt: '2026-01-20' },
]

const STORAGE_KEY = 'cinepilot_crew_demo';

// Load from localStorage or return demo data
function loadFromStorage(): CrewMember[] {
  if (typeof window === 'undefined') return DEMO_CREW;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  // Initialize with demo data and store
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_CREW));
  return DEMO_CREW;
}

// Save to localStorage
function saveToStorage(crew: CrewMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function CrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rate' | 'department'>('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    role: '',
    department: '',
    phone: '',
    email: '',
    dailyRate: '',
    notes: '',
  });
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCrew = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crew');
      const data = await res.json();
      
      // Handle new API format: { crew: [...], isDemoMode: true/false }
      if (data.crew && Array.isArray(data.crew)) {
        setCrew(data.crew);
        setIsDemoMode(data.isDemoMode === true);
        if (!data.isDemoMode) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } else if (Array.isArray(data) && data.length > 0) {
        // Handle legacy API format (array directly)
        setCrew(data);
        setIsDemoMode(false);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // Use demo data when no real data
        const stored = loadFromStorage();
        setCrew(stored);
        setIsDemoMode(true);
      }
      setError(null);
    } catch (err) {
      // Use demo data on error - load from localStorage or use defaults
      const stored = loadFromStorage();
      setCrew(stored);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  // Keyboard shortcuts handler - gets filtered count from DOM to avoid ordering issue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      // Get the actual filtered count from DOM
      const crewCards = document.querySelectorAll('[data-crew-card]')
      const maxIndex = crewCards.length - 1
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedRowIndex(prev => Math.min(prev + 1, maxIndex))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedRowIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          setSelectedRowIndex(0)
          break
        case 'End':
          e.preventDefault()
          setSelectedRowIndex(maxIndex)
          break
        case 'Escape':
          setSelectedRowIndex(-1)
          break
        case '?':
          if (e.shiftKey) {
            e.preventDefault()
            setShowKeyboardHelp(prev => !prev)
          }
          break
        case 'n':
        case 'N':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            setEditingId(null)
            setForm({ name: '', role: '', department: '', phone: '', email: '', dailyRate: '', notes: '' })
            setModalOpen(true)
          }
          break
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            const searchInput = document.querySelector('input[placeholder="Search crew..."]') as HTMLInputElement
            searchInput?.focus()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-scroll to selected crew member
  useEffect(() => {
    if (selectedRowIndex >= 0) {
      const crewCards = document.querySelectorAll('[data-crew-card]')
      const selectedElement = crewCards[selectedRowIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedRowIndex])

  // Memoized filtered and sorted crew
  const filtered = useMemo(() => {
    let result = crew.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
        (c.department && c.department.toLowerCase().includes(search.toLowerCase()));
      const matchDept = deptFilter === 'all' || c.department === deptFilter;
      return matchSearch && matchDept;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rate') {
        const aRate = Number(a.dailyRate) || 0;
        const bRate = Number(b.dailyRate) || 0;
        return bRate - aRate;
      }
      if (sortBy === 'department') {
        if (!a.department) return 1;
        if (!b.department) return -1;
        return a.department.localeCompare(b.department);
      }
      return 0;
    });

    return result;
  }, [crew, search, deptFilter, sortBy]);

  // Format currency in Indian Rupees
  const formatINR = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Export crew to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return
    
    const headers = ['Name', 'Role', 'Department', 'Phone', 'Email', 'Daily Rate', 'Notes']
    const rows = filtered.map(c => [
      c.name,
      c.role || '',
      c.department || '',
      c.phone || '',
      c.email || '',
      c.dailyRate || '',
      c.notes || ''
    ])
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crew-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export crew to JSON
  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalCrew: filtered.length,
      summary: {
        totalDailyRate: formatINR(totalDailyRate),
        totalMonthlyRate: formatINR(totalMonthlyRate),
        avgDailyRate: formatINR(avgDailyRate),
        departments: departments
      },
      crew: filtered.map(c => ({
        name: c.name,
        role: c.role,
        department: c.department,
        phone: c.phone,
        email: c.email,
        dailyRate: c.dailyRate,
        notes: c.notes
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crew-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Department statistics
  const deptStats = useMemo(() => {
    const stats: Record<string, { count: number; rate: number }> = {};
    crew.forEach((c) => {
      const dept = c.department || 'Unassigned';
      if (!stats[dept]) stats[dept] = { count: 0, rate: 0 };
      stats[dept].count++;
      stats[dept].rate += Number(c.dailyRate) || 0;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        rate: data.rate,
        color: DEPT_COLORS[name] || '#64748b',
      }))
      .sort((a, b) => b.count - a.count);
  }, [crew]);

  // Total calculations
  const totalDailyRate = useMemo(
    () =>
      crew.reduce((sum, c) => {
        const rate = c.dailyRate
          ? typeof c.dailyRate === 'string'
            ? parseFloat(c.dailyRate)
            : Number(c.dailyRate)
          : 0;
        return sum + (isNaN(rate) ? 0 : rate);
      }, 0),
    [crew]
  );

  const totalMonthlyRate = totalDailyRate * 30;
  const avgDailyRate = crew.length > 0 ? totalDailyRate / crew.length : 0;
  const departments = Object.keys(
    crew.reduce(
      (acc, c) => {
        const d = c.department || 'Unassigned';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      role: '',
      department: '',
      phone: '',
      email: '',
      dailyRate: '',
      notes: '',
    });
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isDemoMode) {
        // Handle demo mode with localStorage
        const currentCrew = loadFromStorage();
        
        if (editingId) {
          // Update existing
          const updated = currentCrew.map(c => 
            c.id === editingId 
              ? { 
                  ...c, 
                  name: form.name.trim(), 
                  role: form.role.trim(), 
                  department: form.department.trim() || null,
                  phone: form.phone.trim() || null,
                  email: form.email.trim() || null,
                  dailyRate: form.dailyRate ? Number(form.dailyRate) : null,
                  notes: form.notes.trim() || null,
                }
              : c
          );
          saveToStorage(updated);
          setCrew(updated);
          showToast('success', 'Crew member updated');
        } else {
          // Add new
          const newMember: CrewMember = {
            id: `demo-${Date.now()}`,
            name: form.name.trim(),
            role: form.role.trim(),
            department: form.department.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            dailyRate: form.dailyRate ? Number(form.dailyRate) : null,
            notes: form.notes.trim() || null,
            createdAt: new Date().toISOString(),
          };
          const updated = [newMember, ...currentCrew];
          saveToStorage(updated);
          setCrew(updated);
          showToast('success', 'Crew member added');
        }
        closeModal();
        return;
      }

      // Real API mode
      if (editingId) {
        const res = await fetch('/api/crew', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: form.name.trim(),
            role: form.role.trim(),
            department: form.department.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            dailyRate: form.dailyRate ? Number(form.dailyRate) : null,
            notes: form.notes.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        showToast('success', 'Crew member updated');
      } else {
        const res = await fetch('/api/crew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            role: form.role.trim(),
            department: form.department.trim() || undefined,
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
            notes: form.notes.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        showToast('success', 'Crew member added');
      }
      closeModal();
      fetchCrew();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this crew member?')) return;
    
    try {
      if (isDemoMode) {
        // Handle demo mode with localStorage
        const currentCrew = loadFromStorage();
        const updated = currentCrew.filter(c => c.id !== id);
        saveToStorage(updated);
        setCrew(updated);
        showToast('success', 'Crew member deleted');
        return;
      }

      // Real API mode
      const res = await fetch('/api/crew', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      showToast('success', 'Crew member deleted');
      fetchCrew();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border ${
          toast.type === 'success' 
            ? 'bg-emerald-900/90 border-emerald-700 text-emerald-200' 
            : 'bg-red-900/90 border-red-700 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Crew Management</h1>
            {isDemoMode && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Manage your production crew and department breakdown</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Crew
        </button>
        {isDemoMode && (
          <button
            onClick={() => {
              if (confirm('Reset to original demo data? This will remove all your changes.')) {
                localStorage.removeItem(STORAGE_KEY);
                setCrew(DEMO_CREW);
                showToast('success', 'Demo data restored');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        )}
        <button
          onClick={() => setShowKeyboardHelp(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors text-sm"
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Crew</p>
              <p className="text-xl font-semibold">{crew.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Daily Cost</p>
              <p className="text-xl font-semibold">{formatINR(totalDailyRate)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Monthly Cost</p>
              <p className="text-xl font-semibold">{formatINR(totalMonthlyRate)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Avg. Daily Rate</p>
              <p className="text-xl font-semibold">{formatINR(avgDailyRate)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Departments</p>
              <p className="text-xl font-semibold">{departments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown Chart */}
      {deptStats.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Department Breakdown</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#64748b"
                    fontSize={11}
                    width={80}
                    tickFormatter={(value) => value.length > 10 ? `${value.slice(0, 10)}...` : value}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number, name: string) => [
                      name === 'count' ? `${value} members` : formatINR(value),
                      name === 'count' ? 'Crew' : 'Daily Rate',
                    ]}
                  />
                  <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]}>
                    {deptStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-2 gap-3">
              {deptStats.slice(0, 6).map((dept) => (
                <div
                  key={dept.name}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {dept.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      {dept.count} {dept.count === 1 ? 'member' : 'members'}
                    </span>
                    <span className="text-emerald-400">{formatINR(dept.rate)}/day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search crew..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="Unassigned">Unassigned</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'rate' | 'department')}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name">Sort by Name</option>
            <option value="rate">Sort by Rate</option>
            <option value="department">Sort by Department</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-500 flex items-center justify-between">
        <span>Showing {filtered.length} of {crew.length} crew members</span>
        {selectedRowIndex >= 0 && (
          <span className="text-sm text-indigo-400">Row {selectedRowIndex + 1} selected</span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-800 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-xl p-12 border border-slate-800 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">
            {search || deptFilter !== 'all'
              ? 'No crew members match your filters'
              : 'No crew members yet'}
          </p>
          {!search && deptFilter === 'all' && (
            <button
              onClick={openAddModal}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Add your first crew member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member, idx) => (
            <div
              key={member.id}
              data-crew-card
              className={`bg-slate-900 rounded-xl p-4 border transition-all hover:shadow-lg hover:shadow-indigo-500/5 ${
                selectedRowIndex === idx
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${
                      DEPT_COLORS[member.department || ''] || '#64748b'
                    }88, ${DEPT_COLORS[member.department || ''] || '#64748b'}44)`,
                  }}
                >
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-white">{member.name}</h3>
                  <p className="text-indigo-400 text-sm">{member.role}</p>
                  {member.department && (
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded mt-1"
                      style={{
                        backgroundColor: `${DEPT_COLORS[member.department]}22`,
                        color: DEPT_COLORS[member.department],
                      }}
                    >
                      {member.department}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="truncate">{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.dailyRate && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      {formatINR(member.dailyRate)}/day
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Crew Member' : 'Add Crew Member'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role *</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Director of Photography"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="crew@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Daily Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.dailyRate}
                  onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Additional notes about this crew member..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                >
                  {editingId ? 'Save Changes' : 'Add Crew Member'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-indigo-500/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Keyboard Shortcuts
                </span>
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { keys: ['↑', '↓'], desc: 'Navigate crew members', category: 'Navigation' },
                { keys: ['Home'], desc: 'Go to first member', category: 'Navigation' },
                { keys: ['End'], desc: 'Go to last member', category: 'Navigation' },
                { keys: ['Esc'], desc: 'Clear selection', category: 'Navigation' },
                { keys: ['N'], desc: 'Add new crew member', category: 'Actions' },
                { keys: ['F'], desc: 'Focus search', category: 'Actions' },
                { keys: ['?'], desc: 'Toggle this help', category: 'Help' },
              ].map((shortcut, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider w-20">
                      {shortcut.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <kbd 
                          key={i} 
                          className="px-2.5 py-1.5 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-md text-xs font-mono text-indigo-300 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Quick reference for power users</span>
                <span className="flex items-center gap-2">
                  Press 
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-indigo-400">?</kbd> 
                  anytime to toggle
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
