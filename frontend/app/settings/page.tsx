'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    language: 'tamil',
    aiModel: 'gpt-4',
    theme: 'dark',
    notifications: true,
    autoBackup: true,
    tamilOcr: true,
    bilingualOutput: true,
    whatsappUpdates: false,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your CinePilot preferences</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-cinepilot-accent text-black rounded font-medium text-sm"
        >
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">🌐 Default Language</h2>
          <select 
            value={settings.language}
            onChange={(e) => setSettings({...settings, language: e.target.value})}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:border-cinepilot-accent focus:outline-none"
          >
            <option value="tamil">Tamil (தமிழ்)</option>
            <option value="english">English</option>
            <option value="both">Both (Bilingual)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">Default language for new projects and outputs</p>
        </div>

        {/* Tamil Features */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">🇮🇳 Tamil Cinema Features</h2>
          
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="font-medium">Tamil OCR</div>
              <div className="text-sm text-gray-400">Recognize Tamil text in scripts</div>
            </div>
            <Toggle 
              enabled={settings.tamilOcr} 
              onChange={() => setSettings({...settings, tamilOcr: !settings.tamilOcr})} 
            />
          </div>
          
          <div className="flex justify-between items-center py-2 border-t border-gray-800 mt-2">
            <div>
              <div className="font-medium">Bilingual Outputs</div>
              <div className="text-sm text-gray-400">Generate outputs in both Tamil and English</div>
            </div>
            <Toggle 
              enabled={settings.bilingualOutput} 
              onChange={() => setSettings({...settings, bilingualOutput: !settings.bilingualOutput})} 
            />
          </div>
        </div>

        {/* AI Model */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">🤖 AI Model</h2>
          <select 
            value={settings.aiModel}
            onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:border-cinepilot-accent focus:outline-none"
          >
            <option value="gpt-4">GPT-4 (Best Quality)</option>
            <option value="gpt-3.5">GPT-3.5 (Faster)</option>
            <option value="claude">Claude (Creative)</option>
            <option value="local">Local LLaMA (Privacy)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">AI model used for script analysis and generation</p>
        </div>

        {/* Theme */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">🎨 Theme</h2>
          <div className="flex gap-3">
            {['dark', 'light', 'system'].map(theme => (
              <button
                key={theme}
                onClick={() => setSettings({...settings, theme})}
                className={`flex-1 py-2 rounded capitalize transition-colors ${
                  settings.theme === theme 
                    ? 'bg-cinepilot-accent text-black' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">🔔 Notifications</h2>
          
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="font-medium">Push Notifications</div>
              <div className="text-sm text-gray-400">Get updates in the app</div>
            </div>
            <Toggle 
              enabled={settings.notifications} 
              onChange={() => setSettings({...settings, notifications: !settings.notifications})} 
            />
          </div>
          
          <div className="flex justify-between items-center py-2 border-t border-gray-800 mt-2">
            <div>
              <div className="font-medium">WhatsApp Updates</div>
              <div className="text-sm text-gray-400">Receive call sheets on WhatsApp</div>
            </div>
            <Toggle 
              enabled={settings.whatsappUpdates} 
              onChange={() => setSettings({...settings, whatsappUpdates: !settings.whatsappUpdates})} 
            />
          </div>
        </div>

        {/* Data */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">💾 Data & Storage</h2>
          
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="font-medium">Auto Backup</div>
              <div className="text-sm text-gray-400">Backup project data daily</div>
            </div>
            <Toggle 
              enabled={settings.autoBackup} 
              onChange={() => setSettings({...settings, autoBackup: !settings.autoBackup})} 
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-400">
              📥 Export All Data
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-cinepilot-card border border-cinepilot-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">ℹ️ About</h2>
          <div className="text-sm text-gray-400">
            <p>CinePilot v1.0.0</p>
            <p className="mt-1">AI-Powered Pre-Production for Tamil Cinema</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-700'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}
