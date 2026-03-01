/**
 * Project Notes Component
 * CinePilot Phase 28
 * Type-safe implementation
 */

'use client'

import { useState, useEffect } from 'react'
import { ProjectNote, getNotes, createNote, deleteNote } from '../lib/api-phase28'

interface ProjectNotesProps {
  projectId: string | number
  currentUser?: string
}

interface NewNoteData {
  content: string
  category: 'general' | 'idea' | 'feedback' | 'decision' | 'todo'
}

export default function ProjectNotes({ projectId, currentUser = 'User' }: ProjectNotesProps) {
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newNote, setNewNote] = useState<NewNoteData>({ content: '', category: 'general' })

  useEffect(() => {
    loadNotes()
  }, [projectId])

  const loadNotes = async () => {
    try {
      const data = await getNotes(projectId)
      setNotes(data)
    } catch {
      setNotes([])
    }
  }

  const handleCreate = async () => {
    if (!newNote.content.trim()) return
    try {
      await createNote(projectId, { ...newNote, author: currentUser })
      setNewNote({ content: '', category: 'general' })
      setShowForm(false)
      loadNotes()
    } catch {
      console.error('Failed to create note')
    }
  }

  const handleDelete = async (noteId: number) => {
    try {
      await deleteNote(projectId, noteId)
      loadNotes()
    } catch {
      console.error('Failed to delete note')
    }
  }

  const categoryIcons = {
    general: '💭',
    idea: '💡',
    feedback: '💬',
    decision: '✅',
    todo: '📝'
  }

  const categoryColors = {
    general: 'bg-gray-100',
    idea: 'bg-purple-100',
    feedback: 'bg-blue-100',
    decision: 'bg-green-100',
    todo: 'bg-yellow-100'
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📝 Project Notes</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded space-y-2">
          <textarea
            placeholder="Write your note..."
            value={newNote.content}
            onChange={e => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full px-3 py-2 border rounded h-24"
          />
          <div className="flex gap-2">
            <select
              value={newNote.category}
              onChange={e => setNewNote({ ...newNote, category: e.target.value as NewNoteData['category'] })}
              className="px-3 py-2 border rounded"
            >
              <option value="general">💭 General</option>
              <option value="idea">💡 Idea</option>
              <option value="feedback">💬 Feedback</option>
              <option value="decision">✅ Decision</option>
              <option value="todo">📝 Todo</option>
            </select>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-gray-500 text-center py-4">No notes yet. Add one to capture ideas!</p>
        )}
        
        {notes.map(note => (
          <div key={note.id} className={`p-3 rounded border-l-4 ${categoryColors[note.category]}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {categoryIcons[note.category]} {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
              </span>
              <button
                onClick={() => handleDelete(note.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-700">{note.content}</p>
            <div className="text-xs text-gray-500 mt-2">
              By {note.author} • {new Date(note.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
