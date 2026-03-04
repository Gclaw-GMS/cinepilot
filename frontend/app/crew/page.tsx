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
  Briefcase,
  Download,
  Filter,
  BarChart3,
  UsersRound,
  AlertCircle,
  CheckCircle,
  TrendingUp,
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
  createdAt: string;
};

const DEMO_CREW: CrewMember[] = [
  { id: '1', name: 'Ravi Kumar', role: 'Director of Photography', department: 'Camera', phone: '+91 98765 43210', email: 'ravi@cinepilot.ai', dailyRate: '25000', notes: 'Award-winning cinematographer with 15+ years experience', createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Priya Venkatesh', role: 'Director', department: 'Direction', phone: '+91 98765 43211', email: 'priya@cinepilot.ai', dailyRate: '50000', notes: 'National Award winning director', createdAt: '2024-01-15T10:00:00Z' },
  { id: '3', name: 'Arun Raj', role: 'Sound Engineer', department: 'Sound', phone: '+91 98765 43212', email: 'arun@cinepilot.ai', dailyRate: '15000', notes: 'Specialist in outdoor location sound', createdAt: '2024-01-15T10:00:00Z' },
  { id: '4', name: 'Madhavan S', role: 'Gaffer', department: 'Lighting', phone: '+91 98765 43213', email: 'madhavan@cinepilot.ai', dailyRate: '12000', notes: 'Expert in LED and traditional lighting setups', createdAt: '2024-01-15T10:00:00Z' },
  { id: '5', name: 'Lakshmi Narayanan', role: 'Production Designer', department: 'Art', phone: '+91 98765 43214', email: 'lakshmi@cinepilot.ai', dailyRate: '20000', notes: 'Specializes in period dramas', createdAt: '2024-01-15T10:00:00Z' },
  { id: '6', name: 'Karthik R', role: 'Makeup Artist', department: 'Makeup', phone: '+91 98765 43215', email: 'karthik@cinepilot.ai', dailyRate: '10000', notes: 'Prosthetics and special effects makeup expert', createdAt: '2024-01-15T10:00:00Z' },
  { id: '7', name: 'Samantha R', role: 'Costume Designer', department: 'Costume', phone: '+91 98765 43216', email: 'samantha@cinepilot.ai', dailyRate: '18000', notes: 'Contemporary and traditional South Indian costumes', createdAt: '2024-01-15T10:00:00Z' },
  { id: '8', name: 'Vijay B', role: 'Editor', department: 'Production', phone: '+91 98765 43217', email: 'vijay@cinepilot.ai', dailyRate: '22000', notes: 'Known for fast-paced action sequences', createdAt: '2024-01-15T10:00:00Z' },
  { id: '9', name: 'Anand Prakash', role: 'VFX Supervisor', department: 'VFX', phone: '+91 98765 43218', email: 'anand@cinepilot.ai', dailyRate: '35000', notes: 'Specialist in CGI and compositing', createdAt: '2024-01-15T10:00:00Z' },
  { id: '10', name: 'Bala Subramani', role: 'Stunt Choreographer', department: 'Stunts', phone: '+91 98765 43219', email: 'bala@cinepilot.ai', dailyRate: '28000', notes: 'International stunt coordination experience', createdAt: '2024-01-15T10:00:00Z' },
  { id: '11', name: 'Divya K', role: 'Assistant Director', department: 'Direction', phone: '+91 98765 43220', email: 'divya@cinepilot.ai', dailyRate: '8000', notes: 'Assisted on 10+ major Tamil films', createdAt: '2024-01-15T10:00:00Z' },
  { id: '12', name: 'Ramesh T', role: 'Camera Operator', department: 'Camera', phone: '+91 98765 43221', email: 'ramesh@cinepilot.ai', dailyRate: '9000', notes: 'Steadicam and gimbal specialist', createdAt: '2024-01-15T10:00:00Z' },
];

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    department: '',
    phone: '',
    email: '',
    dailyRate: '',
    notes: '',
  });

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

  const filtered = useMemo(() => {
    return crew.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
        (c.department && c.department.toLowerCase().includes(search.toLowerCase()));
      const matchDept = deptFilter === 'all' || c.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [crew, search, deptFilter]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!form.name.trim() || !form.role.trim()) {
      setError('Name and role are required');
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

  const handleExport = () => {
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
    a.download = `crew-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSuccess('Crew data exported!');
    setTimeout(() => setSuccess(null), 3000);
  };

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
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Crew
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

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search crew by name, role, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <span className="text-sm text-slate-500">Showing {filtered.length} of {crew.length}</span>
          </div>
        </div>

        {/* Crew Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Daily Rate</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No crew members found. Add your first crew member!
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
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
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Role *</label>
                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Director of Photography" required />
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
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="name@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Daily Rate (₹)</label>
                <input type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="25000" min="0" />
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
    </div>
  );
}
