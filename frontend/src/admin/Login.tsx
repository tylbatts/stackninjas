// src/admin/Login.tsx
import { useState } from 'react';
import { useAdminAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.debug('[AdminLogin] attempting login', { username });
    await login(username, password);
    console.debug('[AdminLogin] login succeeded, navigating to /admin/tickets');
    // Navigate to admin ticket list (absolute path)
    navigate('/admin/tickets', { replace: true });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <h2 className="mb-4 text-xl font-bold">Admin Login</h2>
        <div className="mb-2">
          <label className="block mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded">
          Sign In
        </button>
      </form>
    </div>
  );
}
