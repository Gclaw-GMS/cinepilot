'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ProductionTimeline from '../components/production-timeline';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Download, Plus, Layers, Grid3X3, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Target, CheckCircle, Zap, Clock, Film, MapPin,
  Filter, RefreshCw, Search, X, HelpCircle, Printer,
  TrendingUp, BarChart3, FileText
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface Project {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  shootDays: number;
  scenes: number;
}

const DEMO_PROJECTS: Project[] = [
  { id: 'all', name: 'All Projects' },
  { id: '1', name: 'Kaadhal Enbadhu' },
  { id: '2', name: 'Vikram Vedha 2' },
];

export default function TimelinePage() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt' | 'calendar'>('timeline');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'phase' | 'type' | 'status' | 'date' | 'scenes' | 'duration'>('phase');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds
  
  // Calculate active filter count (includes sort state)
  const activeFilterCount = (filterType !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)
  
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)
  const [printing, setPrinting] = useState(false)
  const printMenuRef = useRef<HTMLDivElement>(null)
  
  // Refs for keyboard shortcuts to avoid dependency warnings
  const handleRefreshRef = useRef<() => Promise<void>>(async () => {});
  const handlePrintRef = useRef<() => void>(() => {});
  const exportToMarkdownRef = useRef<() => void>(() => {});
  const exportingRef = useRef(exporting);
  const printingRef = useRef(printing);
  const showExportMenuRef = useRef(showExportMenu);
  const showFiltersRef = useRef(showFilters);
  const showPrintMenuRef = useRef(showPrintMenu);
  const filterTypeRef = useRef(filterType);
  const sortByRef = useRef(sortBy);
  const sortOrderRef = useRef(sortOrder);
  const autoRefreshRef = useRef(autoRefresh);
  const autoRefreshIntervalRef = useRef(autoRefreshInterval);
  
  // Update refs when state changes
  useEffect(() => {
    showExportMenuRef.current = showExportMenu;
  }, [showExportMenu]);
  
  useEffect(() => {
    showFiltersRef.current = showFilters;
  }, [showFilters]);
  
  useEffect(() => {
    showPrintMenuRef.current = showPrintMenu;
  }, [showPrintMenu]);
  
  useEffect(() => {
    filterTypeRef.current = filterType;
  }, [filterType]);
  
  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);
  
  useEffect(() => {
    sortOrderRef.current = sortOrder;
  }, [sortOrder]);

  // Keep auto-refresh refs in sync
  useEffect(() => { autoRefreshRef.current = autoRefresh }, [autoRefresh]);
  useEffect(() => { autoRefreshIntervalRef.current = autoRefreshInterval }, [autoRefreshInterval]);

  // Clear all filters function
  const clearFilters = useCallback(() => {
    setFilterType('all')
    setSearchQuery('')
  }, [])

  // Ref for active filter count (for keyboard shortcut)
  const activeFilterCountRef = useRef(0)

  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  // Real stats from API
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    shootDays: 0,
    scenes: 0,
  });

  // Demo stats for when there's no data
  const DEMO_STATS = useMemo(() => ({
    total: 8,
    completed: 2,
    inProgress: 3,
    pending: 3,
    shootDays: 20,
    scenes: 145,
  }), []);

  // Chart data computations
  const statusChartData = useMemo(() => {
    const total = stats.total || 1;
    return [
      { name: 'Completed', value: stats.completed, color: '#22c55e' },
      { name: 'In Progress', value: stats.inProgress, color: '#eab308' },
      { name: 'Pending', value: stats.pending, color: '#64748b' },
    ];
  }, [stats]);

  const progressChartData = useMemo(() => [
    { week: 'Week 1', completed: 2, planned: 3 },
    { week: 'Week 2', completed: 3, planned: 2 },
    { week: 'Week 3', completed: 1, planned: 4 },
    { week: 'Week 4', completed: 4, planned: 3 },
  ], []);

  const phaseTypeChartData = useMemo(() => [
    { type: 'Pre-Prod', count: 3 },
    { type: 'Production', count: 4 },
    { type: 'Post-Prod', count: 2 },
    { type: 'Distribution', count: 1 },
  ], []);

  // Fetch real stats from API
  const fetchStats = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const projectId = selectedProject === 'all' ? 'default-project' : selectedProject;
      
      // Fetch schedule data
      const scheduleRes = await fetch(`/api/schedule?projectId=${projectId}`);
      const scheduleData = await scheduleRes.json();
      
      const shootingDays = scheduleData.shootingDays || [];
      const totalScenes = shootingDays.reduce((sum: number, day: { dayScenes?: unknown[] }) => 
        sum + (day.dayScenes?.length || 0), 0);
      
      // If no real data, use demo stats for better UX
      if (shootingDays.length === 0) {
        setStats(DEMO_STATS);
        setIsDemoMode(true);
      } else {
        setIsDemoMode(false);
        // Calculate stats from real data
        const completed = shootingDays.filter((d: { status: string }) => d.status === 'completed').length;
        const inProgress = shootingDays.filter((d: { status: string }) => d.status === 'in-progress').length;
        const pending = shootingDays.filter((d: { status: string }) => 
          d.status === 'pending' || !d.status).length;
        
        setStats({
          total: shootingDays.length,
          completed,
          inProgress,
          pending,
          shootDays: shootingDays.length,
          scenes: totalScenes,
        });
      }
    } catch (err) {
      console.error('Failed to fetch timeline stats:', err);
      // Use demo stats on error for better UX
      setStats(DEMO_STATS);
      setIsDemoMode(true);
    } finally {
      if (isInitial) setLoading(false);
      setLastUpdated(new Date());
    }
  }, [selectedProject, DEMO_STATS]);

  // Fetch stats on mount and when project changes
  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);
  
  // Update handleRefreshRef when handleRefresh changes
  useEffect(() => {
    handleRefreshRef.current = handleRefresh;
  }, [handleRefresh]);

  // Auto-refresh interval effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchStats();
    }, autoRefreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, fetchStats]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    setShowExportMenu(false);
    
    try {
      const projectId = selectedProject === 'all' ? 'default-project' : selectedProject;
      const res = await fetch(`/api/schedule?projectId=${projectId}`);
      const data = await res.json();
      
      let shootingDays = data.shootingDays || [];
      
      // Apply filters
      if (filterType !== 'all') {
        shootingDays = shootingDays.filter((d: any) => d.type === filterType);
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        shootingDays = shootingDays.filter((d: any) => 
          d.location?.name?.toLowerCase().includes(query) ||
          d.notes?.toLowerCase().includes(query) ||
          d.dayNumber?.toString().includes(query)
        );
      }
      
      // Apply sorting
      shootingDays = [...shootingDays].sort((a: any, b: any) => {
        let comparison = 0;
        switch (sortBy) {
          case 'phase':
            comparison = (a.dayNumber || 0) - (b.dayNumber || 0);
            break;
          case 'type':
            comparison = (a.type || '').localeCompare(b.type || '');
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
          case 'date':
            comparison = new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime();
            break;
          case 'scenes':
            comparison = (a.dayScenes?.length || 0) - (b.dayScenes?.length || 0);
            break;
          case 'duration':
            comparison = (a.estimatedHours || 0) - (b.estimatedHours || 0);
            break;
          default:
            comparison = 0;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      if (format === 'csv') {
        // Create CSV content
        const headers = ['Day', 'Date', 'Location', 'Status', 'Scenes', 'Call Time', 'Hours'];
        const rows = shootingDays.map((day: any) => [
          day.dayNumber || '',
          day.scheduledDate || '',
          day.location?.name || '',
          day.status || '',
          (day.dayScenes || []).length,
          day.callTime || '',
          day.estimatedHours || ''
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeline_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Create JSON content with filter metadata
        const jsonContent = {
          exportDate: new Date().toISOString(),
          projectId,
          filters: {
            type: filterType,
            search: searchQuery,
            sortBy,
            sortOrder
          },
          totalDays: shootingDays.length,
          shootingDays
        };
        const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeline_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed:', e);
    }
    
    setExporting(false);
  };

  // Markdown Export - uses refs to avoid dependency issues
  const exportToMarkdown = useCallback(async () => {
    setExporting(true);
    setShowExportMenu(false);
    
    try {
      const projectId = selectedProject === 'all' ? 'default-project' : selectedProject;
      const res = await fetch(`/api/schedule?projectId=${projectId}`);
      const data = await res.json();
      
      let shootingDays = data.shootingDays || [];
      
      // Apply filters
      if (filterType !== 'all') {
        shootingDays = shootingDays.filter((d: any) => d.type === filterType);
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        shootingDays = shootingDays.filter((d: any) => 
          d.location?.name?.toLowerCase().includes(query) ||
          d.notes?.toLowerCase().includes(query) ||
          d.dayNumber?.toString().includes(query)
        );
      }
      
      // Apply sorting
      shootingDays = [...shootingDays].sort((a: any, b: any) => {
        let comparison = 0;
        switch (sortBy) {
          case 'phase':
            comparison = (a.dayNumber || 0) - (b.dayNumber || 0);
            break;
          case 'type':
            comparison = (a.type || '').localeCompare(b.type || '');
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
          case 'date':
            comparison = new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime();
            break;
          case 'scenes':
            comparison = (a.dayScenes?.length || 0) - (b.dayScenes?.length || 0);
            break;
          case 'duration':
            comparison = (a.estimatedHours || 0) - (b.estimatedHours || 0);
            break;
          default:
            comparison = 0;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      if (shootingDays.length === 0) {
        setExporting(false);
        return;
      }

      // Calculate stats
      const total = shootingDays.length;
      const completed = shootingDays.filter((d: any) => d.status === 'completed').length;
      const inProgress = shootingDays.filter((d: any) => d.status === 'in-progress').length;
      const pending = shootingDays.filter((d: any) => d.status === 'pending').length;
      
      // Calculate by type
      const byType = shootingDays.reduce((acc: Record<string, number>, d: any) => {
        const type = d.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate by status
      const byStatus = shootingDays.reduce((acc: Record<string, number>, d: any) => {
        const status = d.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const getStatusEmoji = (status: string) => {
        switch (status) {
          case 'completed': return '✅';
          case 'in-progress': return '🔄';
          case 'pending': return '⏳';
          default: return '❓';
        }
      };
      
      const getTypeEmoji = (type: string) => {
        switch (type) {
          case 'pre-production': return '🎬';
          case 'production': return '📽️';
          case 'post-production': return '🎞️';
          default: return '📋';
        }
      };
      
      // Build markdown
      let markdown = `# CinePilot Production Timeline

**Generated:** ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
**Project:** ${projectId === 'default-project' ? 'All Projects' : projectId}

---

## Summary

| Metric | Value |
|--------|-------|
| Total Days | ${total} |
| ✅ Completed | ${completed} |
| 🔄 In Progress | ${inProgress} |
| ⏳ Pending | ${pending} |

---

## By Status

| Status | Count |
|--------|-------|
${Object.entries(byStatus).map(([status, count]) => `| ${getStatusEmoji(status)} ${status} | ${count} |`).join('\n')}

---

## By Type

| Type | Count |
|------|-------|
${Object.entries(byType).map(([type, count]) => `| ${getTypeEmoji(type)} ${type} | ${count} |`).join('\n')}

---

## Shooting Days Detail

| Day | Date | Location | Type | Status | Scenes | Call Time | Hours |
|-----|------|----------|------|--------|--------|-----------|-------|
${shootingDays.map((day: any) => `| ${day.dayNumber || '-'} | ${day.scheduledDate || '-'} | ${day.location?.name || '-'} | ${getTypeEmoji(day.type)} ${day.type || '-'} | ${getStatusEmoji(day.status)} ${day.status || '-'} | ${day.dayScenes?.length || 0} | ${day.callTime || '-'} | ${day.estimatedHours || '-'} |`).join('\n')}

---

## Active Filters

| Filter | Value |
|--------|-------|
| Type | ${filterType === 'all' ? 'All Types' : filterType} |
| Search | ${searchQuery || 'None'} |
| Sort By | ${sortBy} (${sortOrder}) |

---

*Generated by CinePilot Production Timeline*
`;
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Markdown export failed:', e);
    }
    
    setExporting(false);
  }, [selectedProject, filterType, searchQuery, sortBy, sortOrder]);

  // Print function
  const handlePrint = useCallback(() => {
    setPrinting(true);
    setShowPrintMenu(false);
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Production Timeline - CinePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1e293b; margin-bottom: 5px; }
    .header p { color: #64748b; font-size: 14px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .stat-card.completed .value { color: #16a34a; }
    .stat-card.in-progress .value { color: #eab308; }
    .stat-card.pending .value { color: #64748b; }
    .legend { display: flex; gap: 20px; justify-content: center; margin-bottom: 30px; font-size: 12px; }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .legend-dot.pre { background: #3b82f6; }
    .legend-dot.prod { background: #8b5cf6; }
    .legend-dot.post { background: #f97316; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { background: #f1f5f9; font-weight: 600; color: #475569; }
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .status-badge.completed { background: #dcfce7; color: #16a34a; }
    .status-badge.in-progress { background: #fef9c3; color: #ca8a04; }
    .status-badge.pending { background: #f1f5f9; color: #64748b; }
    .status-badge.delayed { background: #fee2e2; color: #dc2626; }
    .type-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; }
    .type-badge.pre-production { background: #dbeafe; color: #1d4ed8; }
    .type-badge.production { background: #ede9fe; color: #7c3aed; }
    .type-badge.post-production { background: #ffedd5; color: #ea580c; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Production Timeline Report</h1>
    <p>Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="label">Total Phases</div>
      <div class="value">${stats.total}</div>
    </div>
    <div class="stat-card completed">
      <div class="label">Completed</div>
      <div class="value">${stats.completed}</div>
    </div>
    <div class="stat-card in-progress">
      <div class="label">In Progress</div>
      <div class="value">${stats.inProgress}</div>
    </div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="label">Pending</div>
      <div class="value">${stats.pending}</div>
    </div>
    <div class="stat-card">
      <div class="label">Shoot Days</div>
      <div class="value">${stats.shootDays}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Scenes</div>
      <div class="value">${stats.scenes}</div>
    </div>
  </div>
  
  <div class="legend">
    <div class="legend-item"><div class="legend-dot pre"></div>Pre-Production</div>
    <div class="legend-item"><div class="legend-dot prod"></div>Production</div>
    <div class="legend-item"><div class="legend-dot post"></div>Post-Production</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Phase Name</th>
        <th>Type</th>
        <th>Status</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Pre-Production</td>
        <td><span class="type-badge pre-production">Pre-Production</span></td>
        <td><span class="status-badge completed">Completed</span></td>
        <td>Jan 15, 2026</td>
        <td>Feb 10, 2026</td>
        <td>100%</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Principal Photography</td>
        <td><span class="type-badge production">Production</span></td>
        <td><span class="status-badge in-progress">In Progress</span></td>
        <td>Feb 15, 2026</td>
        <td>Mar 15, 2026</td>
        <td>65%</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Post-Production</td>
        <td><span class="type-badge post-production">Post-Production</span></td>
        <td><span class="status-badge pending">Pending</span></td>
        <td>Mar 20, 2026</td>
        <td>Apr 30, 2026</td>
        <td>0%</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>CinePilot - Production Management System</p>
  </div>
</body>
</html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    setTimeout(() => setPrinting(false), 500);
  }, [stats]);
  
  // Update handlePrintRef when handlePrint changes
  useEffect(() => {
    handlePrintRef.current = handlePrint;
  }, [handlePrint]);

  // Update exportToMarkdownRef when exportToMarkdown changes
  useEffect(() => {
    exportToMarkdownRef.current = exportToMarkdown;
  }, [exportToMarkdown]);

  // Update refs for keyboard shortcut checks
  useEffect(() => {
    exportingRef.current = exporting;
  }, [exporting]);
  
  useEffect(() => {
    printingRef.current = printing;
  }, [printing]);
  
  useEffect(() => {
    showExportMenuRef.current = showExportMenu;
  }, [showExportMenu, showFilters]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          handleRefreshRef.current?.();
          break;
        case 'a':
          // Toggle auto-refresh
          setAutoRefresh(prev => !prev);
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case '1':
          e.preventDefault();
          if (showFiltersRef.current) {
            // When filters open: Show all types
            setFilterType('all');
          } else {
            // When filters closed: Switch to timeline view
            setViewMode('timeline');
          }
          break;
        case '2':
          e.preventDefault();
          if (showFiltersRef.current) {
            // When filters open: Filter by pre-production
            setFilterType(prev => prev === 'pre-production' ? 'all' : 'pre-production');
          } else {
            // When filters closed: Switch to gantt view
            setViewMode('gantt');
          }
          break;
        case '3':
          e.preventDefault();
          if (showFiltersRef.current) {
            // When filters open: Filter by production
            setFilterType(prev => prev === 'production' ? 'all' : 'production');
          } else {
            // When filters closed: Switch to calendar view
            setViewMode('calendar');
          }
          break;
        case '4':
          e.preventDefault();
          if (showFiltersRef.current) {
            // When filters open: Filter by post-production
            setFilterType(prev => prev === 'post-production' ? 'all' : 'post-production');
          }
          break;
        case '0':
          e.preventDefault();
          if (showFiltersRef.current) {
            // When filters open: Clear type filter
            setFilterType('all');
          }
          break;
        case 'f':
          e.preventDefault();
          setShowFilters(s => !s);
          break;
        case '?':
          setShowKeyboardHelp(true);
          break;
        case 'escape':
          setShowKeyboardHelp(false);
          setSearchQuery('');
          setFilterType('all');
          setSortBy('phase');
          setSortOrder('asc');
          setShowFilters(() => false);
          setShowExportMenu(() => false);
          setShowPrintMenu(() => false);
          break;
        case 's':
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
          break;
        case 'e':
          if (!exportingRef.current) {
            setShowExportMenu(!showExportMenuRef.current);
          }
          break;
        case 'm':
          if (!exportingRef.current) {
            exportToMarkdownRef.current?.();
          }
          break;
        case 'p':
          if (!printingRef.current) {
            handlePrintRef.current?.();
          }
          break;
        case 'x':
          e.preventDefault()
          if (showFiltersRef.current && activeFilterCountRef.current > 0) {
            clearFilters()
          }
          break
        // Shift+Number keys for sorting options (when filters open)
        case '!':
        case '@':
        case '#':
        case '$':
        case '%':
        case '^':
          if (showFiltersRef.current) {
            e.preventDefault();
            const sortKeys: Record<string, 'phase' | 'type' | 'status' | 'date' | 'scenes' | 'duration'> = {
              '!': 'phase',
              '@': 'type',
              '#': 'status',
              '$': 'date',
              '%': 'scenes',
              '^': 'duration'
            };
            const newSort = sortKeys[e.key];
            if (newSort) {
              // If same sort key, toggle order; otherwise set new sort and asc order
              if (sortByRef.current === newSort) {
                setSortOrder(sortOrderRef.current === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(newSort);
                setSortOrder('asc');
              }
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside to close menus and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenuRef.current && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showPrintMenuRef.current && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
      if (showFiltersRef.current && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the filter toggle button itself
        const filterButton = document.getElementById('timeline-filter-toggle');
        if (filterButton && filterButton.contains(e.target as Node)) {
          return;
        }
        setShowFilters(() => false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const projectOptions = DEMO_PROJECTS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Production Timeline
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-sm mt-1">Visual project timeline with Gantt chart</p>
                {isDemoMode && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded font-medium">
                    DEMO
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated: {lastUpdated.toLocaleTimeString('en-GB')}
                    {autoRefresh && (
                      <span className="text-emerald-400 ml-1">Auto: {autoRefreshInterval}s</span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search timeline... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing || autoRefresh}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {/* Auto-Refresh Toggle */}
              <div className="relative">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    autoRefresh 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                  title={autoRefresh ? 'Auto-refresh ON - Click to disable (A)' : 'Auto-refresh OFF - Click to enable (A)'}
                >
                  {autoRefresh && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Auto</span>
                </button>
                {autoRefresh && (
                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={10}>10s</option>
                    <option value={30}>30s</option>
                    <option value={60}>1m</option>
                    <option value={300}>5m</option>
                  </select>
                )}
              </div>
              {/* Keyboard Help Button */}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Phase
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">Total Phases</span>
            </div>
            <p className="text-2xl font-semibold text-white">{stats.total}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-slate-400">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-green-400">{stats.completed}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm text-slate-400">In Progress</span>
            </div>
            <p className="text-2xl font-semibold text-yellow-400">{stats.inProgress}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-slate-700/50">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-sm text-slate-400">Pending</span>
            </div>
            <p className="text-2xl font-semibold text-slate-400">{stats.pending}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Film className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">Shoot Days</span>
            </div>
            <p className="text-2xl font-semibold text-purple-400">{stats.shootDays}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <MapPin className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm text-slate-400">Total Scenes</span>
            </div>
            <p className="text-2xl font-semibold text-indigo-400">{stats.scenes}</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Phase Status Distribution - Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-medium text-white">Phase Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly Progress - Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-medium text-white">Weekly Progress</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={progressChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="planned" fill="#6366f1" name="Planned" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Phase Type Distribution - Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-medium text-white">Phases by Type</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={phaseTypeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="type" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" name="Phases" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'timeline' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4 inline mr-1" />
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'gantt' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 inline mr-1" />
                  Gantt
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'calendar' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Calendar
                </button>
              </div>

              {/* Filters */}
              <button
                id="timeline-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  showFilters || filterType !== 'all' || sortOrder !== 'asc' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle Filters & Sort (F)"
              >
                <Filter className="w-4 h-4" />
                Filter & Sort
                {(filterType !== 'all' || sortOrder !== 'asc') && (
                  <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                    {(filterType !== 'all' ? 1 : 0) + (sortOrder !== 'asc' ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Zoom:</span>
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                  className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              
              {/* Export Dropdown Menu */}
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-t-lg flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-green-400" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-yellow-400" />
                    JSON
                  </button>
                  <button
                    onClick={() => exportToMarkdownRef.current?.()}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-b-lg flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Markdown
                  </button>
                </div>
              )}
            </div>

            {/* Print Button */}
            <div className="relative" ref={printMenuRef}>
              <button 
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={printing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {printing ? 'Printing...' : 'Print'}
              </button>
              
              {/* Print Dropdown Menu */}
              {showPrintMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
                  <button
                    onClick={handlePrint}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-lg"
                  >
                    Print Timeline
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                ref={filterPanelRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-6 pt-4 mt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Filter & Sort:</span>
                    <span className="text-xs text-cyan-400 ml-2">(1-4 for type filter, 0 to clear, Shift+1-6 for sort)</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Type:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="pre-production">Pre-Production</option>
                      <option value="production">Production</option>
                      <option value="post-production">Post-Production</option>
                    </select>
                  </div>
                  
                  {/* Sort Options */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="phase">Phase Name</option>
                      <option value="type">Type</option>
                      <option value="status">Status</option>
                      <option value="date">Date</option>
                      <option value="scenes">Scenes</option>
                      <option value="duration">Duration</option>
                    </select>
                  </div>
                  
                  {/* Sort Order Toggle */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortOrder === 'desc' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Sort Order (S)"
                  >
                    {sortOrder === 'asc' ? (
                      <>
                        <span>ASC</span>
                        <span className="text-xs">↑</span>
                      </>
                    ) : (
                      <>
                        <span>DESC</span>
                        <span className="text-xs">↓</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Clear Filters (X)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-slate-400">Pre-Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-slate-400">Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-slate-400">Post-Production</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-green-400"></div>
            <span className="text-slate-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-yellow-400"></div>
            <span className="text-slate-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-transparent"></div>
            <span className="text-slate-400">Pending</span>
          </div>
        </div>

        {/* Timeline Component */}
        <ProductionTimeline projectId={selectedProject} />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="font-medium text-white">Edit Schedule</div>
            </div>
            <div className="text-sm text-slate-400">Modify timeline phases</div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-medium text-white">Auto-Schedule</div>
            </div>
            <div className="text-sm text-slate-400">AI optimize dates</div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Download className="w-4 h-4 text-green-400" />
              </div>
              <div className="font-medium text-white">Export Timeline</div>
            </div>
            <div className="text-sm text-slate-400">PDF/Image export</div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-medium text-white">Assign Tasks</div>
            </div>
            <div className="text-sm text-slate-400">Team assignments</div>
          </motion.button>
        </div>

        {/* Keyboard Shortcuts Help Modal */}
        <AnimatePresence>
          {showKeyboardHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowKeyboardHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setShowKeyboardHelp(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Refresh timeline data</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">R</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Toggle auto-refresh</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">A</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Focus search input</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">/</kbd>
                  </div>
                  
                  {/* View Mode Shortcuts (When filters closed) */}
                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-amber-400 mb-2">When filters closed:</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Switch to Timeline view</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-amber-400">1</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Switch to Gantt view</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-amber-400">2</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Switch to Calendar view</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-amber-400">3</kbd>
                  </div>
                  
                  {/* Filter Shortcuts (When filters open) */}
                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-cyan-400 mb-2">When filters open:</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Show all types</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-cyan-400">1</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Filter pre-production (toggle)</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-cyan-400">2</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Filter production (toggle)</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-cyan-400">3</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Filter post-production (toggle)</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-cyan-400">4</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Clear type filter</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-cyan-400">0</kbd>
                  </div>
                  
                  {/* Sort Shortcuts (When filters open) */}
                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-emerald-400 mb-2">When filters open, sort by:</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Sort by phase</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">⇧+1</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Sort by type</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">⇧+2</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Sort by status</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">⇧+3</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Sort by date</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">⇧+4</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Sort by scenes</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">⇧+5</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Sort by duration</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-emerald-400">⇧+6</kbd>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Toggle filters</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">F</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Toggle sort order (asc/desc)</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">S</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Export timeline</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">E</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Export as Markdown</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">M</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Print timeline</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">P</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Clear all filters</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-amber-400">X</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Show keyboard shortcuts</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">?</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-300">Close modal / Clear search</span>
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-sm font-mono text-purple-400">Esc</kbd>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">?</kbd> anytime to show this help
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
