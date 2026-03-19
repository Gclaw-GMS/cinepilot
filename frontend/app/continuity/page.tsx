'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Eye, AlertTriangle, Search, RefreshCw, FileCheck, AlertCircle, BarChart3, LayoutGrid, List, TrendingDown, TrendingUp, Clock, Target, Zap, Filter, Download, Printer, X, ChevronRight, Keyboard, FileJson, FileText, FileCode } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type Script = { id: string; title: string };

type Warning = {
  id: string;
  sceneId: string;
  warningType: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null };
};

type Summary = {
  total: number;
  continuityIssues: number;
  plotHoles: number;
  bySeverity?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  _demo?: boolean;
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; hex: string }> = {
  low: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600', bar: 'bg-slate-500', hex: '#64748b' },
  medium: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', bar: 'bg-amber-500', hex: '#f59e0b' },
  high: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50', bar: 'bg-orange-500', hex: '#f97316' },
  critical: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', bar: 'bg-red-500', hex: '#ef4444' },
};

const WARNING_TYPES = [
  { key: 'all', label: 'All Issues' },
  { key: 'continuity', label: 'Continuity' },
  { key: 'plot_hole', label: 'Plot Holes' },
  { key: 'character', label: 'Character' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'dialogue', label: 'Dialogue' },
];

// Historical data for trend visualization
const DEMO_HISTORICAL_DATA = [
  { date: '2026-02-01', critical: 3, high: 5, medium: 8, low: 12 },
  { date: '2026-02-08', critical: 2, high: 4, medium: 7, low: 10 },
  { date: '2026-02-15', critical: 1, high: 3, medium: 5, low: 8 },
  { date: '2026-02-22', critical: 1, high: 2, medium: 4, low: 6 },
  { date: '2026-03-01', critical: 0, high: 1, medium: 3, low: 4 },
  { date: '2026-03-06', critical: 0, high: 0, medium: 2, low: 3 },
];

// Scene breakdown data
const DEMO_SCENE_BREAKDOWN = [
  { sceneNumber: '1', issues: 0, status: 'clean' },
  { sceneNumber: '2', issues: 1, status: 'good' },
  { sceneNumber: '3', issues: 2, status: 'warning' },
  { sceneNumber: '4', issues: 0, status: 'clean' },
  { sceneNumber: '5', issues: 3, status: 'critical' },
  { sceneNumber: '6', issues: 1, status: 'good' },
  { sceneNumber: '7', issues: 0, status: 'clean' },
  { sceneNumber: '8', issues: 2, status: 'warning' },
  { sceneNumber: '9', issues: 1, status: 'good' },
  { sceneNumber: '10', issues: 0, status: 'clean' },
];

function getSeverityStyle(severity: string) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
}

export default function ContinuityPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'trends'>('overview');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'scene' | 'severity' | 'type' | 'description'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const fetchDataRef = useRef<() => void | Promise<void>>();
  const selectedScriptRef = useRef(selectedScript);
  const printContinuityReportRef = useRef<() => void>();
  
  // Historical and breakdown data
  const [historicalData] = useState(DEMO_HISTORICAL_DATA);
  const [sceneBreakdown] = useState(DEMO_SCENE_BREAKDOWN);

  // Compute severity counts (needed for stats)
  const severityCounts = warnings.reduce(
    (acc, w) => {
      acc[w.severity] = (acc[w.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Computed statistics
  const stats = useMemo(() => {
    const total = warnings.length;
    const continuityCount = warnings.filter(w => w.warningType === 'continuity').length;
    const plotHoleCount = warnings.filter(w => w.warningType === 'plot_hole').length;
    const characterCount = warnings.filter(w => w.warningType === 'character').length;
    const timelineCount = warnings.filter(w => w.warningType === 'timeline').length;
    const dialogueCount = warnings.filter(w => w.warningType === 'dialogue').length;
    
    const byType = {
      continuity: continuityCount,
      plot_hole: plotHoleCount,
      character: characterCount,
      timeline: timelineCount,
      dialogue: dialogueCount,
    };
    
    const criticalCount = severityCounts.critical || 0;
    const highCount = severityCounts.high || 0;
    const mediumCount = severityCounts.medium || 0;
    const lowCount = severityCounts.low || 0;
    
    // Health score (inverse of issues weighted by severity)
    const healthScore = total > 0 
      ? Math.max(0, 100 - (criticalCount * 15 + highCount * 8 + mediumCount * 4 + lowCount * 1))
      : 100;
    
    // Resolution rate (mock - would be tracked in real app)
    const resolvedCount = 0;
    const resolutionRate = total > 0 ? (resolvedCount / total) * 100 : 0;
    
    return {
      total,
      byType,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      healthScore,
      resolvedCount,
      resolutionRate,
    };
  }, [warnings, severityCounts]);

  // Chart data for type distribution
  const typeDistributionData = useMemo(() => {
    return Object.entries(stats.byType)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        color: type === 'continuity' ? '#6366f1' : 
               type === 'plot_hole' ? '#f59e0b' :
               type === 'character' ? '#10b981' :
               type === 'timeline' ? '#06b6d4' : '#8b5cf6',
      }));
  }, [stats.byType]);

  // Severity pie chart data
  const severityPieData = useMemo(() => {
    return [
      { name: 'Critical', value: stats.criticalCount, color: SEVERITY_COLORS.critical.hex },
      { name: 'High', value: stats.highCount, color: SEVERITY_COLORS.high.hex },
      { name: 'Medium', value: stats.mediumCount, color: SEVERITY_COLORS.medium.hex },
      { name: 'Low', value: stats.lowCount, color: SEVERITY_COLORS.low.hex },
    ].filter(d => d.value > 0);
  }, [stats]);

  useEffect(() => {
    selectedScriptRef.current = selectedScript;
  }, [selectedScript]);

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        setScripts(list);
        // Auto-select first script and load demo data
        if (list.length > 0 && !selectedScriptRef.current) {
          setSelectedScript(list[0].id);
        }
      })
      .catch(() => {
        // If API fails, use demo data
        setScripts([{ id: 'demo', title: 'Demo Script - "The Court"' }]);
        setSelectedScript('demo');
      });
  }, []);

  const fetchWarnings = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/continuity?scriptId=${scriptId}&demo=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      setWarnings(Array.isArray(data) ? data : (data.warnings || []));
      setSummary(data.summary || null);
      setIsDemo(data._demo || false);
    } catch (err) {
      // On error, load demo data
      try {
        const demoRes = await fetch('/api/continuity?scriptId=demo&demo=true');
        const demoData = await demoRes.json();
        setWarnings(demoData.warnings || []);
        setSummary(demoData.summary || null);
        setIsDemo(true);
      } catch {
        setError(err instanceof Error ? err.message : 'Failed to load warnings');
        setWarnings([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedScript) fetchWarnings(selectedScript);
  }, [selectedScript, fetchWarnings]);

  // Assign fetch function to ref for keyboard shortcuts
  fetchDataRef.current = () => {
    if (selectedScript) {
      setRefreshing(true);
      fetchWarnings(selectedScript);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          fetchDataRef.current?.();
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case '1':
          setActiveTab('overview');
          break;
        case '2':
          setActiveTab('breakdown');
          break;
        case '3':
          setActiveTab('trends');
          break;
        case 'e':
          e.preventDefault();
          setShowExportMenu(!showExportMenu);
          break;
        case 'm':
          e.preventDefault();
          if (warnings.length > 0) {
            handleExportRef.current('markdown');
          }
          break;
        case 'p':
          e.preventDefault();
          if (warnings.length > 0) {
            printContinuityReportRef.current?.();
          }
          break;
        case 'f':
          e.preventDefault();
          setShowFilters(!showFilters);
          break;
        case 's':
          e.preventDefault();
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(true);
          break;
        case 'escape':
          e.preventDefault();
          setShowKeyboardHelp(false);
          setShowExportMenu(false);
          setShowFilters(false);
          setShowPrintMenu(false);
          setFilter('');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExportMenu, showFilters, showPrintMenu, warnings.length, sortOrder]);

  // Click outside to close export menu and filter panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, showFilters, showPrintMenu])

  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedScript) fetchWarnings(selectedScript);
    setTimeout(() => setRefreshing(false), 500);
  };

  async function runCheck() {
    if (!selectedScript) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScript, useDemo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      await fetchWarnings(selectedScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Continuity check failed');
    } finally {
      setChecking(false);
    }
  }

  const continuityWarnings = warnings.filter((w) => w.warningType === 'continuity');
  const plotHoleWarnings = warnings.filter((w) => w.warningType === 'plot_hole');

  const filteredContinuity = typeFilter === 'all' || typeFilter === 'continuity'
    ? (filter
        ? continuityWarnings.filter(
            (w) =>
              w.description.toLowerCase().includes(filter.toLowerCase()) ||
              w.scene.sceneNumber.includes(filter) ||
              (w.scene.headingRaw || '').toLowerCase().includes(filter.toLowerCase()),
          )
        : continuityWarnings)
    : [];

  const filteredPlotHoles = typeFilter === 'all' || typeFilter === 'plot_hole'
    ? (filter
        ? plotHoleWarnings.filter(
            (w) =>
              w.description.toLowerCase().includes(filter.toLowerCase()) ||
              w.scene.sceneNumber.includes(filter) ||
              (w.scene.headingRaw || '').toLowerCase().includes(filter.toLowerCase()),
          )
        : plotHoleWarnings)
    : [];

  // Calculate percentages for severity bars
  const total = warnings.length || 1;
  const severityPercentages = {
    critical: ((severityCounts.critical || 0) / total) * 100,
    high: ((severityCounts.high || 0) / total) * 100,
    medium: ((severityCounts.medium || 0) / total) * 100,
    low: ((severityCounts.low || 0) / total) * 100,
  };

  // Filter warnings by type, severity, and search
  const filteredWarnings = useMemo(() => {
    let filtered = warnings;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(w => w.warningType === typeFilter);
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(w => w.severity === severityFilter);
    }
    const searchTerm = searchQuery || filter;
    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.scene.sceneNumber.includes(searchTerm) ||
          (w.scene.headingRaw || '').toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    // Sort warnings
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'scene':
          comparison = a.scene.sceneNumber.localeCompare(b.scene.sceneNumber, undefined, { numeric: true });
          break;
        case 'severity':
          comparison = (severityOrder[a.severity as keyof typeof severityOrder] || 0) - (severityOrder[b.severity as keyof typeof severityOrder] || 0);
          break;
        case 'type':
          comparison = a.warningType.localeCompare(b.warningType);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [warnings, typeFilter, severityFilter, searchQuery, filter, sortBy, sortOrder]);

  // Export handlers
  const handleExport = (format: 'csv' | 'json' | 'pdf' | 'markdown') => {
    const data = filteredWarnings.map(w => ({
      scene: w.scene.sceneNumber,
      heading: w.scene.headingRaw,
      type: w.warningType,
      severity: w.severity,
      description: w.description,
    }));
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `continuity-issues-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else if (format === 'csv') {
      const csv = ['Scene,Heading,Type,Severity,Description']
        .concat(data.map(d => `"${d.scene}","${d.heading || ''}","${d.type}","${d.severity}","${d.description.replace(/"/g, '""')}"`))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `continuity-issues-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (format === 'markdown') {
      // Generate Markdown content
      const severityEmoji: Record<string, string> = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '⚪',
      };
      
      const typeLabels: Record<string, string> = {
        continuity: 'Continuity',
        plot_hole: 'Plot Hole',
        character: 'Character',
        timeline: 'Timeline',
        dialogue: 'Dialogue',
      };
      
      // Calculate summary stats
      const total = data.length;
      const bySeverity = data.reduce((acc, w) => {
        acc[w.severity] = (acc[w.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const byType = data.reduce((acc, w) => {
        acc[w.type] = (acc[w.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let markdown = `# CinePilot Continuity Report

> Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

## Summary

| Metric | Value |
|--------|-------|
| **Total Issues** | ${total} |
| **Critical** | ${bySeverity.critical || 0} |
| **High** | ${bySeverity.high || 0} |
| **Medium** | ${bySeverity.medium || 0} |
| **Low** | ${bySeverity.low || 0} |

## By Severity

`;
      
      // Add severity breakdown
      Object.entries(bySeverity).forEach(([severity, count]) => {
        markdown += `- ${severityEmoji[severity] || '⚪'} **${severity.charAt(0).toUpperCase() + severity.slice(1)}**: ${count}\n`;
      });
      
      markdown += `\n## By Type\n\n`;
      
      // Add type breakdown
      Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        markdown += `- **${typeLabels[type] || type}**: ${count}\n`;
      });
      
      markdown += `\n## Issues Detail\n\n`;
      
      // Add issues table
      markdown += `| Scene | Type | Severity | Description |\n`;
      markdown += `|-------|------|----------|-------------|\n`;
      
      data.forEach(d => {
        const desc = d.description.replace(/\|/g, '\\|').substring(0, 50);
        markdown += `| ${d.scene} | ${typeLabels[d.type] || d.type} | ${severityEmoji[d.severity]} ${d.severity} | ${desc}${d.description.length > 50 ? '...' : ''} |\n`;
      });
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `continuity-report-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
    }
    setShowExportMenu(false);
  };

  // Ref for keyboard shortcut accessibility
  const handleExportRef = useRef(handleExport)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    handleExportRef.current = handleExport
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Print function for Continuity Report
  const printContinuityReport = () => {
    if (warnings.length === 0) return

    const getSeverityColor = (severity: string) => {
      const colors: Record<string, string> = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#f59e0b',
        low: '#64748b',
      }
      return colors[severity] || '#64748b'
    }

    const getTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        continuity: 'Continuity',
        plot_hole: 'Plot Hole',
        character: 'Character',
        timeline: 'Timeline',
        dialogue: 'Dialogue',
      }
      return labels[type] || type
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePilot - Continuity Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .logo { width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 8px; }
    .title { font-size: 24px; font-weight: bold; }
    .subtitle { font-size: 14px; color: #64748b; }
    .timestamp { font-size: 12px; color: #94a3b8; margin-left: auto; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .stat-value.critical { color: #ef4444; }
    .stat-value.high { color: #f97316; }
    .stat-value.medium { color: #f59e0b; }
    .stat-value.low { color: #64748b; }
    .health-score { font-size: 36px; font-weight: bold; color: #10b981; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .severity-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; text-transform: uppercase; }
    .severity-critical { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
    .severity-high { background: #fff7ed; color: #f97316; border: 1px solid #fed7aa; }
    .severity-medium { background: #fffbeb; color: #f59e0b; border: 1px solid #fde68a; }
    .severity-low { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    .type-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; background: #e0e7ff; color: #4338ca; }
    .scene-num { font-weight: bold; color: #6366f1; }
    .description { max-width: 300px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"></div>
    <div>
      <div class="title">CinePilot Continuity Report</div>
      <div class="subtitle">Script Continuity Analysis & Issue Tracking</div>
    </div>
    <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Total Issues</div>
      <div class="stat-value">${stats.total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Health Score</div>
      <div class="health-score">${stats.healthScore}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Critical</div>
      <div class="stat-value critical">${stats.criticalCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">High</div>
      <div class="stat-value high">${stats.highCount}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Continuity</div>
      <div class="stat-value">${stats.byType.continuity}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Plot Holes</div>
      <div class="stat-value">${stats.byType.plot_hole}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Character</div>
      <div class="stat-value">${stats.byType.character}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Timeline</div>
      <div class="stat-value">${stats.byType.timeline}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Scene</th>
        <th>Type</th>
        <th>Severity</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${filteredWarnings.slice(0, 50).map(w => `
        <tr>
          <td class="scene-num">${w.scene.sceneNumber}</td>
          <td><span class="type-badge">${getTypeLabel(w.warningType)}</span></td>
          <td><span class="severity-badge severity-${w.severity}">${w.severity}</span></td>
          <td class="description">${w.description}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${filteredWarnings.length > 50 ? `<p style="text-align: center; color: #64748b; font-size: 12px;">... and ${filteredWarnings.length - 50} more issues</p>` : ''}

  <div class="footer">
    CinePilot - Film Production Management System
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  // Update refs for keyboard shortcuts
  useEffect(() => {
    printContinuityReportRef.current = printContinuityReport;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Continuity Tracker</h1>
              <p className="text-sm text-slate-400">
                Detect character inconsistencies and plot holes across scenes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Health Score Badge */}
            {warnings.length > 0 && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                stats.healthScore >= 80 ? 'bg-emerald-900/20 border-emerald-800/50' :
                stats.healthScore >= 50 ? 'bg-amber-900/20 border-amber-800/50' :
                'bg-red-900/20 border-red-800/50'
              }`}>
                <Target className={`w-4 h-4 ${
                  stats.healthScore >= 80 ? 'text-emerald-400' :
                  stats.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className={`font-semibold ${
                  stats.healthScore >= 80 ? 'text-emerald-400' :
                  stats.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>{stats.healthScore}%</span>
                <span className="text-xs text-slate-400">Health</span>
              </div>
            )}
            {isDemo && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/20 border border-cyan-800/50 rounded-lg">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-xs text-cyan-400">Demo Data</span>
              </div>
            )}
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">/</span>
            </div>
            {/* Filter & Sort Toggle Button */}
            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showFilters || severityFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'severity' || sortOrder !== 'desc'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter & Sort
                {((severityFilter !== 'all' || typeFilter !== 'all') || (sortBy !== 'severity' || sortOrder !== 'desc')) && (
                  <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded">
                    {([severityFilter !== 'all', typeFilter !== 'all', sortBy !== 'severity' || sortOrder !== 'desc'].filter(Boolean)).length}
                  </span>
                )}
              </button>
              {/* Filter & Sort Panel */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Sort By</label>
                      <div className="flex gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                        >
                          <option value="severity">Severity</option>
                          <option value="scene">Scene</option>
                          <option value="type">Type</option>
                          <option value="description">Description</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                          title="Toggle sort order"
                        >
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                      >
                        {WARNING_TYPES.map((type) => (
                          <option key={type.key} value={type.key}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Severity</label>
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                      >
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <button
                      onClick={() => { setTypeFilter('all'); setSeverityFilter('all'); setSortBy('severity'); setSortOrder('desc'); }}
                      className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Clear Filters & Sort
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Print Button */}
            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                disabled={!warnings.length}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:bg-slate-800 rounded-lg text-sm text-white transition-colors"
                title="Print Report (P)"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { printContinuityReport(); setShowPrintMenu(false) }}
                    disabled={!warnings.length}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-sm text-white">Print Report</div>
                      <div className="text-xs text-slate-500">Full analysis with stats</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!warnings.length}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { handleExport('json'); setShowExportMenu(false) }}
                    disabled={!warnings.length}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                  >
                    <FileJson className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-sm text-white">JSON</div>
                      <div className="text-xs text-slate-500">Full analysis data</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { handleExport('csv'); setShowExportMenu(false) }}
                    disabled={!warnings.length}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-sm text-white">CSV</div>
                      <div className="text-xs text-slate-500">Spreadsheet format</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { handleExport('markdown'); setShowExportMenu(false) }}
                    disabled={!warnings.length}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-sm text-white">Markdown</div>
                      <div className="text-xs text-slate-500">Formatted report</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'breakdown', label: 'Scene Breakdown', icon: LayoutGrid },
            { key: 'trends', label: 'Trends', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
            >
              <option value="">Select a script...</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
              <option value="demo">Demo Script - "The Court"</option>
            </select>

            <button
              onClick={runCheck}
              disabled={!selectedScript || checking}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <Zap className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Analyzing...' : 'Run Analysis'}
            </button>

            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {WARNING_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setTypeFilter(type.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    typeFilter === type.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Filter warnings... (/)"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-16 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-mono">/</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && warnings.length > 0 && (
          <>
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Total Issues</span>
                </div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {filteredWarnings.length} shown
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Continuity</span>
                </div>
                <div className="text-3xl font-bold">{stats.byType.continuity}</div>
                <div className="text-xs text-slate-500 mt-1">issues detected</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Plot Holes</span>
                </div>
                <div className="text-3xl font-bold">{stats.byType.plot_hole}</div>
                <div className="text-xs text-slate-500 mt-1">issues detected</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Resolved</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">{stats.resolvedCount}</div>
                <div className="text-xs text-slate-500 mt-1">{stats.resolutionRate.toFixed(0)}% rate</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Severity Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Severity Distribution
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Critical', value: stats.criticalCount, fill: SEVERITY_COLORS.critical.hex },
                      { name: 'High', value: stats.highCount, fill: SEVERITY_COLORS.high.hex },
                      { name: 'Medium', value: stats.mediumCount, fill: SEVERITY_COLORS.medium.hex },
                      { name: 'Low', value: stats.lowCount, fill: SEVERITY_COLORS.low.hex },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Type Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  Issue Type Distribution
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#64748b' }}
                      >
                        {typeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Issue Trend Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#colorCritical)" name="Critical" />
                    <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="url(#colorHigh)" name="High" />
                    <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="url(#colorMedium)" name="Medium" />
                    <Area type="monotone" dataKey="low" stackId="1" stroke="#64748b" fill="url(#colorLow)" name="Low" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && warnings.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
              Scene-by-Scene Breakdown
            </h3>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[80px_1fr_100px_100px] gap-2 mb-2 px-2">
                  <span className="text-xs text-slate-400 uppercase">Scene</span>
                  <span className="text-xs text-slate-400 uppercase">Heading</span>
                  <span className="text-xs text-slate-400 uppercase text-right">Issues</span>
                  <span className="text-xs text-slate-400 uppercase text-right">Status</span>
                </div>
                {sceneBreakdown.map((scene) => (
                  <div 
                    key={scene.sceneNumber}
                    className={`grid grid-cols-[80px_1fr_100px_100px] gap-2 items-center px-2 py-3 rounded-lg mb-1 ${
                      scene.status === 'clean' ? 'bg-emerald-900/10' :
                      scene.status === 'good' ? 'bg-blue-900/10' :
                      scene.status === 'warning' ? 'bg-amber-900/10' :
                      'bg-red-900/10'
                    }`}
                  >
                    <span className="font-mono text-sm text-slate-300">#{scene.sceneNumber}</span>
                    <span className="text-xs text-slate-500 truncate">
                      Scene {scene.sceneNumber} Description
                    </span>
                    <span className="text-right font-semibold">{scene.issues}</span>
                    <span className={`text-right text-xs px-2 py-1 rounded-full ${
                      scene.status === 'clean' ? 'bg-emerald-500/20 text-emerald-400' :
                      scene.status === 'good' ? 'bg-blue-500/20 text-blue-400' :
                      scene.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {scene.status === 'clean' ? '✓ Clean' :
                       scene.status === 'good' ? '✓ Good' :
                       scene.status === 'warning' ? '⚠ Warning' : '✗ Critical'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Resolution Progress
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} name="Medium" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="low" stroke="#64748b" strokeWidth={2} name="Low" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Reduced</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">75%</div>
                <div className="text-xs text-slate-500 mt-1">since first check</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Avg Resolution</span>
                </div>
                <div className="text-2xl font-bold">2.3 days</div>
                <div className="text-xs text-slate-500 mt-1">per issue</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Target</span>
                </div>
                <div className="text-2xl font-bold">95%</div>
                <div className="text-xs text-slate-500 mt-1">health score goal</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Check Streak</span>
                </div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-xs text-slate-500 mt-1">consecutive checks</div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-slate-400">Analyzing script for continuity issues...</div>
          </div>
        )}

        {!loading && warnings.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800/50 rounded-xl">
            <FileCheck className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
            <div className="text-xl font-semibold text-slate-300 mb-2">No Issues Found</div>
            <div className="text-slate-500 max-w-md mx-auto">
              Your script looks clean! Run a continuity check to analyze for potential issues.
            </div>
            <button
              onClick={runCheck}
              className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Run Analysis Now
            </button>
          </div>
        )}

        {/* Continuity Issues */}
        {filteredContinuity.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Continuity Issues
              <span className="text-sm text-slate-500 font-normal">
                ({filteredContinuity.length})
              </span>
            </h2>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
              {filteredContinuity.map((w) => {
                const style = getSeverityStyle(w.severity);
                return (
                  <div
                    key={w.id}
                    className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-4 ${viewMode === 'grid' ? 'flex-col' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Eye className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Scene {w.scene.sceneNumber}
                        </span>
                        {w.scene.headingRaw && (
                          <span className="text-xs text-slate-500 truncate">
                            {w.scene.headingRaw}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200">{w.description}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {w.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plot Holes */}
        {filteredPlotHoles.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Plot Holes
              <span className="text-sm text-slate-500 font-normal">
                ({filteredPlotHoles.length})
              </span>
            </h2>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
              {filteredPlotHoles.map((w) => {
                const style = getSeverityStyle(w.severity);
                return (
                  <div
                    key={w.id}
                    className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-4 ${viewMode === 'grid' ? 'flex-col' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Scene {w.scene.sceneNumber}
                        </span>
                        {w.scene.headingRaw && (
                          <span className="text-xs text-slate-500 truncate">
                            {w.scene.headingRaw}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200">{w.description}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {w.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-sm text-slate-400">Continuity Tracker</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'R', description: 'Refresh continuity data' },
                { key: '/', description: 'Focus search input' },
                { key: 'F', description: 'Toggle filters panel' },
                { key: 'S', description: 'Toggle sort order (asc/desc)' },
                { key: 'E', description: 'Toggle export dropdown' },
                { key: 'M', description: 'Export as Markdown' },
                { key: 'P', description: 'Print continuity report' },
                { key: '1', description: 'Switch to Overview tab' },
                { key: '2', description: 'Switch to Breakdown tab' },
                { key: '3', description: 'Switch to Trends tab' },
                { key: '?', description: 'Show keyboard shortcuts' },
                { key: 'Esc', description: 'Close modal / Clear filters' },
              ].map((shortcut) => (
                <div 
                  key={shortcut.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-slate-300">{shortcut.description}</span>
                  <kbd className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-indigo-400 font-mono text-sm font-medium">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
