// CinePilot - WhatsApp Template Manager
// Manage and send WhatsApp message templates

'use client'

import { useState, useEffect } from 'react'
import { whatsappTemplates, type WhatsAppTemplate } from '../lib/api-phase24'

interface WhatsAppTemplateManagerProps {
  onMessageSent?: (result: any) => void
}

export default function WhatsAppTemplateManager({ onMessageSent }: WhatsAppTemplateManagerProps) {
  const [templates, setTemplates] = useState<Record<string, WhatsAppTemplate>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [recipient, setRecipient] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      const vars = templates[selectedTemplate].variables.reduce((acc, v) => {
        acc[v] = ''
        return acc
      }, {} as Record<string, string>)
      setVariables(vars)
    }
  }, [selectedTemplate, templates])

  const loadTemplates = async () => {
    try {
      const res = await whatsappTemplates.list()
      setTemplates(res.templates)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!selectedTemplate || !recipient) return
    
    setSending(true)
    setResult(null)
    
    try {
      const res = await whatsappTemplates.send({
        template_name: selectedTemplate,
        recipient,
        variables
      })
      setResult(res)
      onMessageSent?.(res)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
  }

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Template
        </label>
        <select
          value={selectedTemplate || ''}
          onChange={(e) => setSelectedTemplate(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="">Choose a template...</option>
          {Object.entries(templates).map(([key, tmpl]) => (
            <option key={key} value={key}>{tmpl.name}</option>
          ))}
        </select>
      </div>

      {/* Recipient */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Recipient Phone
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
      </div>

      {/* Variables */}
      {selectedTemplate && templates[selectedTemplate] && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Template Variables
          </label>
          {templates[selectedTemplate].variables.map((v) => (
            <div key={v}>
              <label className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {v.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                value={variables[v] || ''}
                onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder={`Enter ${v.replace(/_/g, ' ')}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {selectedTemplate && templates[selectedTemplate] && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</p>
          <p className="text-sm whitespace-pre-wrap">
            {templates[selectedTemplate].template
              .split('{')
              .map((part, i) => {
                if (i === 0) return part
                const [key, ...rest] = part.split('}')
                const value = variables[key] || `[${key}]`
                return value + rest.join('}')
              })
              .join('')}
          </p>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!selectedTemplate || !recipient || sending}
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {sending ? 'Sending...' : 'Send WhatsApp Message'}
      </button>

      {/* Result */}
      {result && (
        <div className={`rounded-lg p-3 ${result.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          {result.error ? (
            <p className="text-red-600 dark:text-red-400 text-sm">{result.error}</p>
          ) : (
            <p className="text-green-600 dark:text-green-400 text-sm">
              ✓ Message sent successfully at {new Date(result.sent_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
