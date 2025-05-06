import React, { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import axios from 'axios'
import CommentThread from '../components/CommentThread'
import SuggestedWorkflows from '../components/SuggestedWorkflows'

export default function TicketDetail() {
  const { id } = useParams()
  const token = sessionStorage.getItem('access_token')
  if (!token) {
    return <Navigate to="/" replace />
  }
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`/tickets/${id}`)
      .then(res => setTicket(res.data))
      .catch(() => setError('Failed to load ticket'))
  }, [id])

  if (error) return <p className="text-red-500">{error}</p>
  if (!ticket) return <p>Loading...</p>

  return (
    <div className="container mx-auto p-4">
      <Link to="/tickets" className="text-blue-500 mb-4 inline-block">← Back to Tickets</Link>
      <h1 className="text-2xl font-bold mb-4">{ticket.title}</h1>
      <p className="mb-2"><strong>Description:</strong> {ticket.description}</p>
      <p className="mb-2"><strong>Category:</strong> {ticket.category}</p>
      <p className="mb-2"><strong>Status:</strong> {ticket.status}</p>
      <p className="mb-6"><strong>Assigned To:</strong> {ticket.assigned_to || '(unassigned)'}</p>
      <SuggestedWorkflows ticketId={ticket.id} />
      <CommentThread ticketId={ticket.id} />
    </div>
  )
}