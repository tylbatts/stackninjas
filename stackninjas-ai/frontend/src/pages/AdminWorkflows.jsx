import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Navigate } from 'react-router-dom'
import jwt_decode from 'jwt-decode'

export default function AdminWorkflows() {
  const token = sessionStorage.getItem('access_token')
  if (!token) {
    return <Navigate to="/" replace />
  }
  let roles = []
  try {
    roles = jwt_decode(token).realm_access?.roles || []
  } catch {
    return <Navigate to="/admin" replace />
  }
  if (!roles.includes('admin')) {
    return <Navigate to="/admin" replace />
  }

  const [suggestions, setSuggestions] = useState([])
  const [newTag, setNewTag] = useState('')
  const [newSummary, setNewSummary] = useState('')
  const [newSteps, setNewSteps] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTag, setEditTag] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editSteps, setEditSteps] = useState('')

  useEffect(() => {
    loadSuggestions()
  }, [])

  function loadSuggestions() {
    axios.get('/suggestions')
      .then(res => setSuggestions(res.data))
      .catch(err => console.error(err))
  }

  const handleCreate = async e => {
    e.preventDefault()
    try {
      await axios.post('/suggestions', { tag: newTag, summary: newSummary, steps: newSteps })
      setNewTag(''); setNewSummary(''); setNewSteps('')
      loadSuggestions()
    } catch (e) {
      console.error(e)
      alert('Failed to create suggestion')
    }
  }

  const startEdit = sug => {
    setEditingId(sug.id)
    setEditTag(sug.tag)
    setEditSummary(sug.summary)
    setEditSteps(sug.steps)
  }

  const handleUpdate = async sug => {
    try {
      await axios.put(`/suggestions/${sug.id}`, { tag: editTag, summary: editSummary, steps: editSteps })
      setEditingId(null)
      loadSuggestions()
    } catch (e) {
      console.error(e)
      alert('Failed to update suggestion')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this suggestion?')) return
    try {
      await axios.delete(`/suggestions/${id}`)
      loadSuggestions()
    } catch (e) {
      console.error(e)
      alert('Failed to delete suggestion')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Workflow Suggestions</h1>
      <form onSubmit={handleCreate} className="space-y-2 mb-6">
        <div>
          <label className="block">Tag</label>
          <input value={newTag} onChange={e => setNewTag(e.target.value)} required className="w-full border p-1" />
        </div>
        <div>
          <label className="block">Summary</label>
          <input value={newSummary} onChange={e => setNewSummary(e.target.value)} required className="w-full border p-1" />
        </div>
        <div>
          <label className="block">Steps</label>
          <textarea value={newSteps} onChange={e => setNewSteps(e.target.value)} required rows={4} className="w-full border p-1" />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Suggestion</button>
      </form>
      <table className="min-w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Tag</th>
            <th className="border px-2 py-1">Summary</th>
            <th className="border px-2 py-1">Created By</th>
            <th className="border px-2 py-1">Created At</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map(sug => (
            <tr key={sug.id}>
              <td className="border px-2 py-1">
                {editingId === sug.id
                  ? <input value={editTag} onChange={e => setEditTag(e.target.value)} className="border p-1" />
                  : sug.tag}
              </td>
              <td className="border px-2 py-1">
                {editingId === sug.id
                  ? <input value={editSummary} onChange={e => setEditSummary(e.target.value)} className="border p-1 w-full" />
                  : sug.summary}
              </td>
              <td className="border px-2 py-1">{sug.created_by}</td>
              <td className="border px-2 py-1">{new Date(sug.created_at).toLocaleString()}</td>
              <td className="border px-2 py-1 space-x-2">
                {editingId === sug.id
                  ? <>
                      <button onClick={() => handleUpdate(sug)} className="text-green-500">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-red-500">Cancel</button>
                    </>
                  : <>
                      <button onClick={() => startEdit(sug)} className="text-yellow-500">Edit</button>
                      <button onClick={() => handleDelete(sug.id)} className="text-red-500">Delete</button>
                    </>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}