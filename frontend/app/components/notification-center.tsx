'use client'
import { useState } from 'react'

export default function NotificationCenter() {
  const [templates, setTemplates] = useState<any[]>([])
  
  return (
    <div className="p-4">
      <h2>Notifications</h2>
    </div>
  )
}
