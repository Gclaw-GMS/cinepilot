"use client"

import { useState } from 'react'

type ReportType = 'dood' | 'callsheet' | 'budget' | 'script' | 'progress' | 'inventory'

export default function ReportGenerator({ projectId, projectName = "Project" }: { projectId?: number; projectName?: string }) {
  const [reportType, setReportType] = useState<ReportType>('dood')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const reportTypes = [
    { id: 'dood', name: 'DOOD', desc: 'Day Out of Days', icon: '📅' },
    { id: 'callsheet', name: 'Call Sheet', desc: 'Daily call sheet', icon: '📋' },
    { id: 'budget', name: 'Budget', desc: 'Financial breakdown', icon: '💰' },
    { id: 'script', name: 'Script Report', desc: 'Scene & character analysis', icon: '📄' },
    { id: 'progress', name: 'Progress', desc: 'Production progress', icon: '📊' },
    { id: 'inventory', name: 'Inventory', desc: 'Equipment list', icon: '🎥' },
  ]

  const handleGenerate = () => {
    setGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 1500)
  }

  const handleDownload = (format: 'pdf' | 'excel' | 'json') => {
    alert(`Downloading ${reportType} report as ${format.toUpperCase()}...`)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">📑 Report Generator</h2>

      {/* Report Type Selection */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {reportTypes.map(rt => (
          <button
            key={rt.id}
            onClick={() => { setReportType(rt.id as ReportType); setGenerated(false) }}
            className={`p-4 rounded-lg text-left transition ${
              reportType === rt.id 
                ? 'bg-blue-600 border-2 border-blue-400' 
                : 'bg-gray-800 border-2 border-transparent hover:bg-gray-700'
            }`}
          >
            <div className="text-2xl mb-1">{rt.icon}</div>
            <div className="font-semibold">{rt.name}</div>
            <div className="text-xs text-gray-400">{rt.desc}</div>
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          {generating ? '⏳ Generating...' : '⚡ Generate Report'}
        </button>
        {generated && (
          <button
            onClick={() => setGenerated(false)}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg"
          >
            ↻ Regenerate
          </button>
        )}
      </div>

      {/* Preview */}
      {generated && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Preview: {reportTypes.find(r => r.id === reportType)?.name}</h3>
            <div className="flex gap-2">
              <button onClick={() => handleDownload('pdf')} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                📄 PDF
              </button>
              <button onClick={() => handleDownload('excel')} className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm">
                📊 Excel
              </button>
              <button onClick={() => handleDownload('json')} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">
                📋 JSON
              </button>
            </div>
          </div>

          {/* Sample Report Content */}
          <div className="font-mono text-sm bg-gray-900 p-4 rounded overflow-x-auto">
            {reportType === 'dood' && (
              <pre>{`╔══════════════════════════════════════════╗
║     DAY OUT OF DAYS REPORT             ║
║     ${projectName}                      ║
╠══════════════════════════════════════════╣
║ Character      │ Total Days │ Schedule  ║
╠────────────────┼────────────┼───────────╣
║ Arjun          │     15     │ 1,2,3,5..  ║
║ Priya          │     12     │ 1,2,4,5..  ║
║ Mahendra       │      8     │ 3,7,11...  ║
║ Sarath         │      6     │ 2,5,8...   ║
╚══════════════════════════════════════════╝`}
            </pre>)}
            
            {reportType === 'callsheet' && (
              <pre>{`╔══════════════════════════════════════════╗
║     CALL SHEET - DAY 1                  ║
║     ${projectDate()}                    ║
╠══════════════════════════════════════════╣
📍 Location: Meenakshi Temple, Madurai
⏰ Call Time: 05:00
🎬 Scenes: 1, 2, 3

CREW CALLS:
• Director: 05:00
• DP: 04:30
• Camera: 05:00
• Lighting: 05:00
• Cast A (Arjun): 06:00
• Cast B (Priya): 07:00

WEATHER: Sunny, 32°C
TRANSPORT: Depart studio 04:00`}
            </pre>)}
            
            {reportType === 'budget' && (
              <pre>{`╔══════════════════════════════════════════╗
║     BUDGET BREAKDOWN                   ║
║     ${projectName}                      ║
╠══════════════════════════════════════════╣
Category        │ Estimated │ Actual
────────────────┼───────────┼─────────
Pre-Production  │ ₹3,00,000 │ ₹2,80,000
Production      │ ₹18,00,000│ ₹16,50,000
Post-Production │ ₹6,00,000 │ ₹5,50,000
Contingency     │ ₹3,00,000 │ ---
────────────────┼───────────┼─────────
TOTAL           │ ₹30,00,000│ ₹24,80,000

Variance: -₹5,20,000 (17.3%)`}
            </pre>)}
            
            {reportType === 'progress' && (
              <pre>{`╔══════════════════════════════════════════╗
║     PRODUCTION PROGRESS                ║
║     ${projectName}                      ║
╠══════════════════════════════════════════╣
Overall: ████████░░ 80%

PHASE BREAKDOWN:
• Pre-Production: ██████████ 100%
• Production:    ████████░░ 80%
• Post-Production: ████░░░░░░ 40%

TASKS:
✓ Script finalized (100%)
✓ Locations locked (100%)
✓ Casting complete (100%)
○ Shooting 80% (16/20 days)
○ Editing 40%
○ VFX 10%`}
            </pre>)}
            
            {(reportType === 'script' || reportType === 'inventory') && (
              <pre>{`╔══════════════════════════════════════════╗
║     ${reportType.toUpperCase()} REPORT                   ║
║     ${projectName}                      ║
╠══════════════════════════════════════════╣
[Report content generated based on 
 ${reportType === 'script' ? 'script analysis' : 'equipment database'}
 
 Click download to get full report]`}
            </pre>)}
          </div>
        </div>
      )}
    </div>
  )
}

function projectDate() {
  const d = new Date()
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
}
