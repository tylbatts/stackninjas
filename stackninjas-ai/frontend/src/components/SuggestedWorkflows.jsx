import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function SuggestedWorkflows({ ticketId }) {
  const [suggestions, setSuggestions] = useState([])
  const [openMap, setOpenMap] = useState({})

  useEffect(() => {
    axios.get(`/tickets/${ticketId}/suggested-workflows`)
      .then(res => setSuggestions(res.data))
      .catch(err => console.error(err))
  }, [ticketId])

  const toggle = idx => {
    setOpenMap(m => ({ ...m, [idx]: !m[idx] }))
  }

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Suggested Workflows</h3>
      {suggestions.map((sug, idx) => (
        <div key={sug.id} className="border p-3 rounded mb-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold mr-2">[{sug.tag}]</span>
              {sug.summary}
            </div>
            <button
              onClick={() => toggle(idx)}
              className="text-blue-500 text-sm"
            >
              {openMap[idx] ? 'Hide Steps' : 'Show Steps'}
            </button>
          </div>
          {openMap[idx] && (
            <div className="mt-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {sug.steps}
              </ReactMarkdown>
              <button
                onClick={() => copyToClipboard(sug.steps)}
                className="mt-2 bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm"
              >Copy Steps</button>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => console.log('helpful', sug.id)}
                  className="text-green-600 text-sm"
                >👍 Helpful</button>
                <button
                  onClick={() => console.log('not helpful', sug.id)}
                  className="text-red-600 text-sm"
                >👎 Not Helpful</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}