'use client'
import { useState } from 'react'
export default function ProgressTracker() {
  const [progress, setProgress] = useState<any>(null)
  return <div className="p-4"><h2>Progress</h2></div>
}
