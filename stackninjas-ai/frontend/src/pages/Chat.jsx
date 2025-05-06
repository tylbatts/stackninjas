import React, { useState } from 'react'
import axios from 'axios'

export default function Chat() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const user_id = sessionStorage.getItem('user_id')
    const res = await axios.post('/chatbot/respond', {
      user_id,
      question: message
    })
    setResponse(res.data.answer)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-4">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full border px-2 py-1"
          placeholder="Ask a question..."
        />
        <button
          type="submit"
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
      {response && (
        <div className="border p-4 rounded bg-gray-100">{response}</div>
      )}
    </div>
  )
}
