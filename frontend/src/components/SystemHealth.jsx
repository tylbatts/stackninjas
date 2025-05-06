import React, { useState, useEffect } from 'react'

export default function SystemHealth() {
  const API_URL = import.meta.env.VITE_API_URL
  const QDRANT_URL = import.meta.env.VITE_QDRANT_URL
  const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL
  const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM

  const services = [
    { key: 'backend', name: 'Backend', url: `${API_URL}/healthz` },
    { key: 'qdrant', name: 'Qdrant', url: `${QDRANT_URL}/collections` },
    { key: 'keycloak', name: 'Keycloak', url: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/.well-known/openid-configuration` },
  ]

  const [statuses, setStatuses] = useState({
    backend: 'unknown',
    qdrant: 'unknown',
    keycloak: 'unknown',
  })

  useEffect(() => {
    services.forEach(svc => {
      fetch(svc.url, { method: 'GET' })
        .then(res => {
          setStatuses(prev => ({
            ...prev,
            [svc.key]: res.ok ? 'healthy' : 'unhealthy',
          }))
        })
        .catch(() => {
          setStatuses(prev => ({
            ...prev,
            [svc.key]: 'unhealthy',
          }))
        })
    })
  }, [])

  const colors = {
    healthy: 'bg-green-200 text-green-800',
    unhealthy: 'bg-red-200 text-red-800',
    unknown: 'bg-yellow-200 text-yellow-800',
  }

  return (
    <table className="min-w-full border-collapse border">
      <thead>
        <tr>
          <th className="border px-2 py-1">Service</th>
          <th className="border px-2 py-1">Status</th>
        </tr>
      </thead>
      <tbody>
        {services.map(svc => (
          <tr key={svc.key}>
            <td className="border px-2 py-1">{svc.name}</td>
            <td className="border px-2 py-1">
              <span className={`px-2 py-1 rounded ${colors[statuses[svc.key]]}`}>{statuses[svc.key]}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}