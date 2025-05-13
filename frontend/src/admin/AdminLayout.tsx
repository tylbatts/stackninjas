// Removed unused default React import under new JSX transform
import { Outlet, NavLink } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
      <aside className="w-64 bg-white dark:bg-gray-900 p-4">
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin/tickets" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Tickets
          </NavLink>
          <NavLink to="/admin/unclaimed" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Unclaimed
          </NavLink>
          <NavLink to="/admin/my-claims" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            My Claims
          </NavLink>
          <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Profile
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}