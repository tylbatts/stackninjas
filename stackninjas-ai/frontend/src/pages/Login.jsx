import React from 'react'

export default function Login({ onLogin }) {
  return (
    <div className="h-screen flex items-center justify-center">
      <button onClick={onLogin} className="bg-blue-500 text-white px-6 py-3 rounded">
        Login with Keycloak
      </button>
    </div>
  )
}
