import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import Login from './pages/Login'
import Tickets from './pages/Tickets'
import NewTicket from './pages/NewTicket'
import Chat from './pages/Chat'
import AdminDashboard from './pages/AdminDashboard'
import AdminWorkflows from './pages/AdminWorkflows'
import AdminTicketDetail from './pages/AdminTicketDetail'
import TicketDetail from './pages/TicketDetail'

function App() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('access_token')

  useEffect(() => {
    const hash = window.location.hash
    if (!token && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        sessionStorage.setItem('access_token', accessToken)
        const decoded = jwt_decode(accessToken)
        sessionStorage.setItem('user_id', decoded.sub)
        navigate('/tickets', { replace: true })
        window.location.hash = ''
      }
    }
  }, [token, navigate])

  const handleLogin = () => {
    const { VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID } = import.meta.env
    const redirectUri = encodeURIComponent(window.location.origin)
    const url = `${VITE_KEYCLOAK_URL}/realms/${VITE_KEYCLOAK_REALM}/protocol/openid-connect/auth?response_type=token&client_id=${VITE_KEYCLOAK_CLIENT_ID}&redirect_uri=${redirectUri}`
    window.location.href = url
  }

  const handleLogout = () => {
    sessionStorage.clear()
    navigate('/', { replace: true })
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  // Decode roles from token
  const decodedToken = jwt_decode(token)
  const roles = decodedToken.realm_access?.roles || []
  // Configure axios
  axios.defaults.baseURL = import.meta.env.VITE_API_URL
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

  return (
    <div className="container mx-auto p-4">
      <nav className="flex space-x-4 mb-4">
        <Link to="/tickets" className="text-blue-500">Tickets</Link>
        <Link to="/chat" className="text-blue-500">Chat</Link>
        {roles.includes('admin') && (
          <> 
            <Link to="/admin" className="text-blue-500">Admin</Link>
            <Link to="/admin/workflows" className="text-blue-500">Workflows</Link>
          </>
        )}
        <button onClick={handleLogout} className="ml-auto text-red-500">Logout</button>
      </nav>
      <Routes>
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/new" element={<NewTicket />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
        <Route path="/admin/workflows" element={<AdminWorkflows />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="*" element={<Navigate to="/tickets" />} />
      </Routes>
    </div>
  )
}

export default App
