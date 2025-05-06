import React, { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import jwt_decode from 'jwt-decode'
import axios from 'axios'
import CommentThread from '../components/CommentThread'
import SuggestedWorkflows from '../components/SuggestedWorkflows'

export default function AdminTicketDetail() {
  const { id } = useParams()
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

  const [ticket, setTicket] = useState(null)
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [resolution, setResolution] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`/tickets/${id}`)
      .then(res => {
        const t = res.data
        setTicket(t)
        setStatus(t.status)
        setAssignedTo(t.assigned_to || '')
        setResolution(t.resolution || '')
      })
      .catch(() => setError('Failed to load ticket'))
  }, [id])

  if (error) {
    return <p className="text-red-500">{error}</p>
  }
  if (!ticket) {
    return <p>Loading...</p>
  }

  return (
    <div className="container mx-auto p-4">
      <Link to="/admin" className="text-blue-500 mb-4 inline-block">← Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mb-4">{ticket.title}</h1>
      <p className="mb-2"><strong>Description:</strong> {ticket.description}</p>
      <p className="mb-2"><strong>Category:</strong> {ticket.category}</p>
      {/* Status and assignment inline */}
      <div className="mb-4 flex items-center space-x-8">
        <div>
          <label className="font-semibold mr-2">Status:</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border p-1 rounded"
          >
            {['open', 'in-progress', 'resolved'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="font-semibold mr-2">Assigned To:</label>
          <span>{assignedTo || '(unassigned)'}</span>
          <button
            onClick={() => setAssignedTo(sessionStorage.getItem('user_id') || '')}
            className="ml-4 bg-blue-500 text-white px-2 py-1 rounded text-sm"
          >Assign to me</button>
        </div>
      </div>
      <div className="mb-2">
        <label className="font-semibold block">Resolution Notes:</label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          className="w-full border p-2"
          rows={4}
          placeholder="Enter resolution notes or fixes..."
        />
      </div>
      <p className="mb-2"><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
      <p className="mb-6"><strong>User:</strong> {ticket.user_id}</p>
      <button
        onClick={async () => {
          try {
            await axios.put(`/tickets/${ticket.id}`, {
              title: ticket.title,
              description: ticket.description,
              category: ticket.category,
              status,
              resolution,
              assigned_to: assignedTo,
            })
            alert('Ticket updated')
          } catch (e) {
            console.error(e)
            alert('Failed to update ticket')
          }
        }}
        className="bg-green-500 text-white px-4 py-2 rounded mb-6"
      >Save Changes</button>
      <SuggestedWorkflows ticketId={ticket.id} />
      <CommentThread ticketId={ticket.id} />
    </div>
  )
}