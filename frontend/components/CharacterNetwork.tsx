'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface CharacterNetworkProps {
  scenes?: any[];
  characters?: any[];
}

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  sceneCount: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  sharedScenes: number;
  strength: number;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function CharacterNetwork({ scenes = [], characters = [] }: CharacterNetworkProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Auto-load demo data if no scenes provided
  useEffect(() => {
    if (scenes.length === 0 && !results) {
      loadDemoData();
    }
  }, []);

  const loadDemoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/character-network', {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setError('Failed to load demo data');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze characters');
    }
    setLoading(false);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/character-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, characters }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze characters');
    }
    setLoading(false);
  };

  // Calculate node positions for circular layout
  const nodePositions = useMemo(() => {
    if (!results?.network?.nodes) return [];
    
    const nodes = results.network.nodes as NetworkNode[];
    const centerX = 200;
    const centerY = 150;
    const radius = Math.min(120, 40 + nodes.length * 8);
    
    return nodes.map((node, idx) => {
      const angle = (2 * Math.PI * idx) / nodes.length - Math.PI / 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [results?.network?.nodes]);

  // Prepare chart data
  const characterChartData = useMemo(() => {
    if (!results?.central_characters) return [];
    return results.central_characters.slice(0, 8).map((char: any, idx: number) => ({
      name: char.label.length > 12 ? char.label.slice(0, 12) + '...' : char.label,
      fullName: char.label,
      scenes: char.scene_count,
      screenTime: char.screen_time,
      fill: COLORS[idx % COLORS.length],
    }));
  }, [results?.central_characters]);

  const relationshipStrengthData = useMemo(() => {
    if (!results?.network?.edges) return [];
    return results.network.edges.slice(0, 8).map((edge: any) => ({
      name: `${edge.from_label?.slice(0, 6)} ↔ ${edge.to_label?.slice(0, 6)}`,
      scenes: edge.shared_scenes,
      strength: Math.min(100, edge.shared_scenes * 20),
    }));
  }, [results?.network?.edges]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 rounded-xl p-6 border border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🔗 Character Network Analysis
          </h3>
          <p className="text-slate-400 text-sm mt-1">Visualize character relationships and centrality</p>
        </div>
        {results?.demo && (
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
            Demo Data
          </span>
        )}
      </div>

      <button
        onClick={analyze}
        disabled={loading}
        className="w-full mb-6 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> Analyzing...
          </>
        ) : scenes.length > 0 ? (
          '🎬 Generate Character Network'
        ) : (
          '📊 Load Demo Data'
        )}
      </button>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/30">
          {error}
        </div>
      )}
      
      {results && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-wider">Characters</p>
              <p className="text-2xl font-bold text-white">{results.network?.nodes?.length || 0}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-wider">Relationships</p>
              <p className="text-2xl font-bold text-violet-400">{results.total_relationships}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-wider">Network Density</p>
              <p className="text-2xl font-bold text-cyan-400">{results.summary?.network_density || 0}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-wider">Total Scenes</p>
              <p className="text-2xl font-bold text-emerald-400">{results.summary?.total_scenes || 0}</p>
            </div>
          </div>

          {/* Network Visualization */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              🕸️ Character Relationship Map
            </h4>
            <div className="relative">
              <svg viewBox="0 0 400 300" className="w-full h-auto">
                {/* Draw edges first (behind nodes) */}
                {results.network?.edges?.slice(0, 15).map((edge: NetworkEdge, i: number) => {
                  const fromNode = nodePositions.find(n => n.label === edge.fromLabel);
                  const toNode = nodePositions.find(n => n.label === edge.toLabel);
                  if (!fromNode || !toNode) return null;
                  
                  const isHighlighted = selectedNode === edge.fromLabel || selectedNode === edge.toLabel;
                  const opacity = isHighlighted ? 1 : 0.3;
                  
                  return (
                    <g key={`edge-${i}`}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={isHighlighted ? '#8b5cf6' : '#475569'}
                        strokeWidth={Math.max(1, edge.sharedScenes / 2)}
                        strokeOpacity={opacity}
                      />
                      {edge.sharedScenes > 2 && (
                        <text
                          x={(fromNode.x + toNode.x) / 2}
                          y={(fromNode.y + toNode.y) / 2}
                          fill="#94a3b8"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {edge.sharedScenes}
                        </text>
                      )}
                    </g>
                  );
                })}
                
                {/* Draw nodes */}
                {nodePositions.map((node, i) => {
                  const isSelected = selectedNode === node.label;
                  const isTop3 = i < 3;
                  
                  return (
                    <g 
                      key={node.id} 
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedNode(isSelected ? null : node.label)}
                    >
                      {/* Glow for top characters */}
                      {isTop3 && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.size + 8}
                          fill="none"
                          stroke={COLORS[i]}
                          strokeWidth="2"
                          strokeOpacity="0.5"
                        />
                      )}
                      
                      {/* Main node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill={COLORS[i % COLORS.length]}
                        stroke={isSelected ? '#fff' : 'transparent'}
                        strokeWidth="2"
                        opacity={selectedNode && !isSelected ? 0.4 : 1}
                      />
                      
                      {/* Node label */}
                      <text
                        x={node.x}
                        y={node.y + node.size + 14}
                        fill="#e2e8f0"
                        fontSize="10"
                        fontWeight={isTop3 ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {node.label.length > 10 ? node.label.slice(0, 10) + '...' : node.label}
                      </text>
                      
                      {/* Scene count badge */}
                      <text
                        x={node.x}
                        y={node.y + 4}
                        fill="#fff"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.sceneCount}
                      </text>
                    </g>
                  );
                })}
              </svg>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {results.central_characters?.slice(0, 5).map((char: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-slate-400">{char.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Character Appearance Chart */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                📊 Scene Appearances
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={characterChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#64748b" 
                      fontSize={9} 
                      width={60}
                      tickFormatter={(v) => v.length > 8 ? v.slice(0, 8) + '..' : v}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number, name: string, props: any) => [`${value} scenes`, props.payload.fullName]}
                    />
                    <Bar dataKey="scenes" radius={[0, 4, 4, 0]}>
                      {characterChartData.map((entry: { fill: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Relationship Strength Chart */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                🔗 Relationship Strength
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={relationshipStrengthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={8} 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tickFormatter={(v) => v.length > 10 ? '..' : v}
                    />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value} shared scenes`, 'Strength']}
                    />
                    <Bar dataKey="scenes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Characters with Cards */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              ⭐ Central Characters (By Screen Time)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.central_characters?.slice(0, 6).map((char: any, i: number) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedNode === char.label 
                      ? 'bg-violet-500/20 border-violet-500/50' 
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedNode(selectedNode === char.label ? null : char.label)}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length] }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{char.label}</p>
                    <p className="text-slate-400 text-xs">{char.scene_count} scenes • {char.screen_time} min</p>
                  </div>
                  <div className="w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${(char.scene_count / (results.central_characters[0]?.scene_count || 1)) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {results.insights && results.insights.length > 0 && (
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl p-4 border border-green-700/30">
              <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                💡 AI Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.insights.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-green-100/80">
                    <span className="text-green-400 mt-0.5">→</span>
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {(!results && !loading) && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🕸️</span>
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Character Network Analysis</h4>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Analyze character relationships, identify central characters, and visualize the story's social network
          </p>
        </div>
      )}
    </motion.div>
  );
}
