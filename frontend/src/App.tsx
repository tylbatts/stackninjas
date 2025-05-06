// frontend/src/App.tsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitTicket from './pages/SubmitTicket';
import TicketsList from './pages/TicketsList';
import AIPlaceholder from './pages/AIPlaceholder';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit"    element={<SubmitTicket />} />
          <Route path="/tickets"   element={<TicketsList />} />
          <Route path="/ai"        element={<AIPlaceholder />} />
        </Route>

        {/* Catch-all redirects to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

