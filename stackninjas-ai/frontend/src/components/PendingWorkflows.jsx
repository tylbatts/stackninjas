import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function PendingWorkflows() {
  const [pending, setPending] = useState([])
  const [error, setError] = useState(null)

  const loadPending = () => {
    axios.get('/admin/workflows/pending')
      .then(res => {
        setPending(res.data)
        setError(null)
      })
      .catch(() => setError('Failed to load pending workflows'))
  }

  useEffect(() => { loadPending() }, [])

  const handleApprove = (id) => {
    if (!window.confirm('Approve this workflow suggestion?')) return
    axios.post(`/admin/workflows/${id}/approve`)
      .then(() => loadPending())
      .catch(() => alert('Failed to approve suggestion'))
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (pending.length === 0) {
    return <p>No pending workflow suggestions.</p>
  }

  return (
    <div className="space-y-4">
      {pending.map(sug => (
        <div key={sug.id} className="border p-4 rounded">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold">[{sug.tag}]</span> {sug.summary}
              {sug.SourceTicketID && (
                <span className="ml-2 text-sm text-gray-500">
                  (from ticket {sug.source_ticket_id})
                </span>
              )}
            </div>
            <button
              onClick={() => handleApprove(sug.id)}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Approve
            </button>
          </div>
          <div className="mt-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {sug.steps}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}