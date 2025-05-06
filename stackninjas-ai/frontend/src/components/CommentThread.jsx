import React, { useState, useEffect } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function CommentThread({ ticketId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState(null)
  const token = sessionStorage.getItem('access_token')
  let roles = []
  try {
    roles = jwt_decode(token).realm_access?.roles || []
  } catch {}
  const canComment = roles.includes('admin')

  useEffect(() => {
    axios.get(`/tickets/${ticketId}/comments`)
      .then(res => setComments(res.data))
      .catch(err => setError('Failed to load comments'))
  }, [ticketId])

  const handleSubmit = e => {
    e.preventDefault()
    if (!newComment.trim()) return
    axios.post(`/tickets/${ticketId}/comments`, { content: newComment })
      .then(res => {
        setComments(prev => [...prev, res.data])
        setNewComment('')
      })
      .catch(err => setError('Failed to post comment'))
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Comments</h3>
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4 mb-4">
        {comments.map(c => (
          <div key={c.id} className="border p-2 rounded">
            <div className="text-sm text-gray-600">
              {c.author_id} at {new Date(c.created_at).toLocaleString()}
            </div>
            <div className="mt-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {c.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            rows={3}
            className="w-full border p-2"
            placeholder="Add a comment..."
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Submit Comment
          </button>
        </form>
      )}
    </div>
  )
}