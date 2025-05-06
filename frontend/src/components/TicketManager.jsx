import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function TicketManager() {
  const [tickets, setTickets] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editResolution, setEditResolution] = useState('')
  const [showDetails, setShowDetails] = useState({})

  useEffect(() => {
    axios.get('/tickets')
      .then(res => setTickets(res.data))
      .catch(err => console.error(err))
  }, [])

  // Unique statuses and categories
  const statuses = [...new Set(tickets.map(t => t.status))]
  const categories = [...new Set(tickets.map(t => t.category))]

  // Filter tickets based on selections
  const filtered = tickets.filter(t =>
    (statusFilter ? t.status === statusFilter : true) &&
    (categoryFilter ? t.category === categoryFilter : true)
  )

  const toggleDetails = id => {
    setShowDetails(sd => ({ ...sd, [id]: !sd[id] }))
  }

  const handleEdit = ticket => {
    setEditingId(ticket.id)
    setEditStatus(ticket.status)
    setEditResolution(ticket.resolution || '')
  }

  const handleSave = async ticket => {
    try {
      await axios.put(`/tickets/${ticket.id}`, {
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        status: editStatus,
        resolution: editResolution,
      })
      setTickets(ts => ts.map(t => t.id === ticket.id ? { ...t, status: editStatus, resolution: editResolution } : t))
      setEditingId(null)
    } catch (e) {
      console.error(e)
      alert('Failed to update ticket')
    }
  }

  const handleCancel = () => setEditingId(null)

  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <div>
          <label>Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border ml-2 p-1">
            <option value="">All</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Category:</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border ml-2 p-1">
            <option value="">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <table className="min-w-full border-collapse border mb-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Title</th>
            <th className="border px-2 py-1">Category</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Created At</th>
            <th className="border px-2 py-1">User ID</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(ticket => (
            <React.Fragment key={ticket.id}>
              <tr>
                <td className="border px-2 py-1">{ticket.title}</td>
                <td className="border px-2 py-1">{ticket.category}</td>
                <td className="border px-2 py-1">
                  {editingId === ticket.id
                    ? (
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="border p-1">
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )
                    : ticket.status
                  }
                </td>
                <td className="border px-2 py-1">{new Date(ticket.created_at).toLocaleString()}</td>
                <td className="border px-2 py-1">{ticket.user_id}</td>
                <td className="border px-2 py-1 space-x-2">
                  <button onClick={() => toggleDetails(ticket.id)} className="text-blue-500 text-sm">
                    {showDetails[ticket.id] ? 'Hide' : 'View'}
                  </button>
                  {editingId === ticket.id
                    ? <>
                        <button onClick={() => handleSave(ticket)} className="text-green-500 text-sm">Save</button>
                        <button onClick={handleCancel} className="text-red-500 text-sm">Cancel</button>
                      </>
                    : <button onClick={() => handleEdit(ticket)} className="text-yellow-500 text-sm">Edit</button>
                  }
                </td>
              </tr>
              {showDetails[ticket.id] && (
                <tr>
                  <td colSpan={6} className="border px-2 py-1 bg-gray-100">
                    <p><strong>Description:</strong> {ticket.description}</p>
                    <p><strong>Resolution:</strong> {ticket.resolution || <em>(none)</em>}</p>
                    {editingId === ticket.id && (
                      <textarea
                        value={editResolution}
                        onChange={e => setEditResolution(e.target.value)}
                        className="w-full border p-1 mt-2"
                      />
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}