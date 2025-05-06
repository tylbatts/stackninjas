import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function NewTicket() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('open')
  const [resolution, setResolution] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/tickets', { title, description, category, status, resolution })
    navigate('/tickets')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Ticket</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Category</label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Status</label>
          <input
            type="text"
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Resolution</label>
          <textarea
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            className="w-full border px-2 py-1"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  )
}
