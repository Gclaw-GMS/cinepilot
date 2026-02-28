'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

const DollarSignIcon = DollarSign;
const CalendarIcon = Calendar;
const BriefcaseIcon = Briefcase;

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

// Demo data for when database is not available
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
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      // If we get empty array, fall back to demo data
      if (Array.isArray(data) && data.length > 0) {
        setCrew(data);
      } else {
        // Use demo data when no real data available
        setCrew(DEMO_CREW);
      }
      setError(null);
    } catch (err) {
      // Fall back to demo data on any error
      console.warn('Using demo crew data:', err);
      setCrew(DEMO_CREW);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  const filtered = crew.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
      (c.department && c.department.toLowerCase().includes(search.toLowerCase()));
    const matchDept = deptFilter === 'all' || c.department === deptFilter;
    return matchSearch && matchDept;
  });

  // Format currency in Indian Rupees
  const formatINR = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const deptCounts = crew.reduce<Record<string, number>>((acc, c) => {
    const d = c.department || 'Unassigned';
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  // Calculate total daily rate
  const totalDailyRate = crew.reduce((sum, c) => {
    const rate = c.dailyRate ? (typeof c.dailyRate === 'string' ? parseFloat(c.dailyRate) : Number(c.dailyRate)) : 0;
    return sum + (isNaN(rate) ? 0 : rate);
  }, 0);

  // Department breakdown for chart
  const deptData = DEPARTMENTS.map(dept => ({
    name: dept,
    count: deptCounts[dept] || 0,
    rate: crew.filter(c => c.department === dept).reduce((sum, c) => {
      const r = c.dailyRate ? (typeof c.dailyRate === 'string' ? parseFloat(c.dailyRate) : Number(c.dailyRate)) : 0;
      return sum + (isNaN(r) ? 0 : r);
    }, 0)
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

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
      }
      closeModal();
      fetchCrew();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this crew member?')) return;
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
      fetchCrew();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Crew</h1>
          <p className="text-slate-400 text-sm">Manage your production crew</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Crew
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Crew</p>
              <p className="text-xl font-semibold">{crew.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSignIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Daily Cost</p>
              <p className="text-xl font-semibold">{formatINR(totalDailyRate)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Monthly Cost</p>
              <p className="text-xl font-semibold">{formatINR(totalDailyRate * 30)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Departments</p>
              <p className="text-xl font-semibold">{Object.keys(deptCounts).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      {deptData.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Department Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {deptData.slice(0, 5).map((dept) => (
              <div key={dept.name} className="text-center">
                <div className="text-2xl font-semibold text-indigo-400">{dept.count}</div>
                <div className="text-xs text-slate-500 truncate">{dept.name}</div>
                <div className="text-xs text-slate-600">{formatINR(dept.rate)}/day</div>
              </div>
            ))}
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
              className="w-full pl-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
        </div>
      </div>

      {/* Crew Grid */}
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">No crew members found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/80 to-orange-600/80 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{member.name}</h3>
                  <p className="text-indigo-400 text-sm">{member.role}</p>
                  {member.department && (
                    <p className="text-slate-500 text-xs">{member.department}</p>
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
              <div className="mt-4 flex flex-col gap-1">
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    {member.email}
                  </div>
                )}
                {member.dailyRate && (
                  <p className="text-slate-500 text-xs">
                    Daily: {formatINR(member.dailyRate)}
                  </p>
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
                <label className="block text-sm text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Role *
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
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
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Daily Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.dailyRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dailyRate: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  {editingId ? 'Save' : 'Add'}
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
    </div>
  );
}
