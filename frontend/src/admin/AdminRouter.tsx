import { Routes, Route, Navigate } from 'react-router-dom';
import DebugRouterTracer from './DebugRouterTracer';
import AdminLogin from './Login';
import AdminLayout from './AdminLayout';
import RequireAuth from './RequireAuth';
import TicketsList from './TicketsList';
import TicketDetail from './TicketDetail';
import Profile from './Profile';

export default function AdminRouter() {
  return (
    <DebugRouterTracer>
      <Routes>
      {/* Public login route */}
      <Route path="login" element={<AdminLogin />} />
      {/* Protected admin routes */}
      <Route path="" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Navigate to="tickets" replace />} />
        <Route path="tickets" element={<TicketsList />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="unclaimed" element={<TicketsList unclaimed />} />
        <Route path="my-claims" element={<TicketsList mine />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      {/* Fallback to login */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </DebugRouterTracer>
  );
}