'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Download, ChevronDown, ChevronRight } from 'lucide-react'

interface ChecklistItem {
  id: number
  category: string
  name: string
  required: boolean
  quantity: number
  checked: boolean
  notes: string
}

interface EquipmentChecklistProps {
  items: ChecklistItem[]
  onItemToggle: (id: number) => void
  onItemUpdate: (id: number, data: Partial<ChecklistItem>) => void
  shootDays?: number
}

export const EquipmentChecklist: React.FC<EquipmentChecklistProps> = ({
  items,
  onItemToggle,
  onItemUpdate,
  shootDays = 1
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([...new Set(items.map(i => i.category))])
  )

  const categories = [...new Set(items.map(i => i.category))]
  
  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    setExpandedCategories(next)
  }

  const getCategoryProgress = (cat: string) => {
    const catItems = items.filter(i => i.category === cat)
    const checked = catItems.filter(i => i.checked).length
    return { checked, total: catItems.length, percent: Math.round((checked / catItems.length) * 100) }
  }

  const totalRequired = items.filter(i => i.required).length
  const totalChecked = items.filter(i => i.checked && i.required).length

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Overall Progress</span>
          <span className="text-indigo-400">{totalChecked}/{totalRequired} required items checked</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalChecked / totalRequired) * 100}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      {/* Categories */}
      {categories.map(category => {
        const progress = getCategoryProgress(category)
        const isExpanded = expandedCategories.has(category)
        const catItems = items.filter(i => i.category === category)

        return (
          <div key={category} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                <span className="text-white font-medium">{category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">{progress.checked}/{progress.total}</span>
                <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-700"
                >
                  <div className="p-2 space-y-1">
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded ${
                          item.checked ? 'bg-green-900/20' : 'hover:bg-gray-700/50'
                        }`}
                      >
                        <button
                          onClick={() => onItemToggle(item.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            item.checked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {item.checked && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-gray-500">{item.notes}</p>
                          )}
                        </div>
                        <span className="text-gray-500 text-xs">×{item.quantity}</span>
                        {item.required && (
                          <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">Required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// Equipment Checklist Generator
interface EquipmentGeneratorProps {
  projectId: number
  shootDays: number
}

export const EquipmentGenerator: React.FC<EquipmentGeneratorProps> = ({ projectId, shootDays }) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [generated, setGenerated] = useState(false)

  const generateChecklist = async () => {
    setLoading(true)
    // Simulated - would call API in real app
    setTimeout(() => {
      setItems([
        { id: 1, category: 'Camera', name: 'ARRI Alexa Mini', required: true, quantity: 2, checked: false, notes: 'Main camera body' },
        { id: 2, category: 'Camera', name: 'Cooke S7/i Full Frame Plus', required: true, quantity: 1, checked: false, notes: 'Prime lenses set' },
        { id: 3, category: 'Camera', name: 'Tripod', required: true, quantity: 3, checked: false, notes: '' },
        { id: 4, category: 'Lighting', name: 'ARRI SkyPanel S60-C', required: true, quantity: 4, checked: false, notes: '' },
        { id: 5, category: 'Lighting', name: 'ARRI M40', required: false, quantity: 2, checked: false, notes: 'HMI lights' },
        { id: 6, category: 'Lighting', name: 'Grip Equipment', required: true, quantity: 1, checked: false, notes: 'C-stands, flags, gels' },
        { id: 7, category: 'Sound', name: 'Sound Mixer', required: true, quantity: 1, checked: false, notes: '' },
        { id: 8, category: 'Sound', name: 'Lavalier Mics', required: true, quantity: 6, checked: false, notes: '' },
        { id: 9, category: 'Sound', name: 'Boom Pole', required: true, quantity: 2, checked: false, notes: '' },
        { id: 10, category: 'Production', name: 'Production Van', required: true, quantity: 1, checked: false, notes: '' },
        { id: 11, category: 'Production', name: 'Makeup Trailer', required: false, quantity: 1, checked: false, notes: '' },
        { id: 12, category: 'Misc', name: 'COVID Kit', required: true, quantity: 1, checked: false, notes: 'Masks, sanitizer' },
      ])
      setGenerated(true)
      setLoading(false)
    }, 1500)
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting as ${format}`)
    // Would call API in real app
  }

  if (!generated) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-900/50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Generate Equipment Checklist</h3>
        <p className="text-gray-400 mb-4">Based on {shootDays} shoot day(s), we'll create a comprehensive equipment list</p>
        <button
          onClick={generateChecklist}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg"
        >
          {loading ? 'Generating...' : 'Generate Checklist'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Equipment Checklist</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>
      <EquipmentChecklist
        items={items}
        onItemToggle={(id) => setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))}
        onItemUpdate={(id, data) => setItems(items.map(i => i.id === id ? { ...i, ...data } : i))}
        shootDays={shootDays}
      />
    </div>
  )
}

export default EquipmentChecklist
