import React from 'react'
import jwt_decode from 'jwt-decode'
import { Navigate } from 'react-router-dom'
import TicketManager from '../components/TicketManager'
import UserActivity from '../components/UserActivity'
import SystemHealth from '../components/SystemHealth'
import PendingWorkflows from '../components/PendingWorkflows'

export default function AdminDashboard() {
  const token = sessionStorage.getItem('access_token')
  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/" replace />
  }
  // Decode roles and check for admin
  let roles = []
  try {
    const decoded = jwt_decode(token)
    roles = decoded.realm_access?.roles || []
  } catch {
    return <Navigate to="/tickets" replace />
  }
  if (!roles.includes('admin')) {
    return <Navigate to="/tickets" replace />
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Ticket Overview</h2>
        <TicketManager />
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">User Activity</h2>
        <UserActivity />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Pending Workflows</h2>
        <PendingWorkflows />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">System Health</h2>
        <SystemHealth />
      </section>
    </div>
  )
}