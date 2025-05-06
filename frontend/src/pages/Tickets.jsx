import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Tickets() {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    axios.get('/tickets').then(res => setTickets(res.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
      <Link to="/tickets/new" className="bg-green-500 text-white px-4 py-2 rounded mb-4 inline-block">
        New Ticket
      </Link>
      <ul className="space-y-4">
        {tickets.map(ticket => (
          <li key={ticket.id} className="border p-4 rounded">
            <h2 className="font-semibold text-blue-500">
              <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
            </h2>
            <p>{ticket.description}</p>
            <p className="text-sm text-gray-500">Category: {ticket.category}</p>
            <p className="text-sm text-gray-500">Status: {ticket.status}</p>
            <p className="text-sm text-gray-500">Resolution: {ticket.resolution}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
