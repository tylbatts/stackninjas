import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function UserActivity() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/admin/user-activity')
      .then(res => setUsers(res.data))
      .catch(err => {
        console.error(err)
        setError('Failed to load user activity')
      })
  }, [])

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <table className="min-w-full border-collapse border">
      <thead>
        <tr>
          <th className="border px-2 py-1">User ID</th>
          <th className="border px-2 py-1">Tickets</th>
          <th className="border px-2 py-1">Last Login</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.user_id}>
            <td className="border px-2 py-1">{u.user_id}</td>
            <td className="border px-2 py-1 text-center">{u.ticket_count}</td>
            <td className="border px-2 py-1">{u.last_login || <em>n/a</em>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}