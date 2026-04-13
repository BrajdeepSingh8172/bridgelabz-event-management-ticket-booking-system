import { Routes, Route } from 'react-router-dom';
import { useSessionRestore } from './hooks/useSessionRestore';
import MainLayout       from './layouts/MainLayout';
import DashboardLayout  from './layouts/DashboardLayout';
import AdminLayout      from './layouts/AdminLayout';

import ProtectedRoute   from './components/layout/ProtectedRoute';
import RoleRoute        from './components/layout/RoleRoute';

import Home             from './pages/Home';
import Events           from './pages/Events';
import EventDetail      from './pages/EventDetail';
import Checkout         from './pages/Checkout';
import PaymentSuccess   from './pages/PaymentSuccess';

import Login            from './pages/auth/Login';
import Register         from './pages/auth/Register';
import AuthCallback     from './pages/auth/AuthCallback';

import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import MyEvents         from './pages/dashboard/MyEvents';
import CreateEvent      from './pages/dashboard/CreateEvent';
import EditEvent        from './pages/dashboard/EditEvent';
import ManageTickets    from './pages/dashboard/ManageTickets';

import Profile          from './pages/profile/Profile';

import AdminDashboard   from './pages/admin/AdminDashboard';
import ManageUsers      from './pages/admin/ManageUsers';
import ManageEvents     from './pages/admin/ManageEvents';

export default function App() {
  useSessionRestore(); // Silently restore user from token on page reload
  return (
    <Routes>
      {/* ── Public Routes (MainLayout) ───────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected general routes */}
        <Route path="/checkout/:eventId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Route>

      {/* ── Organizer Routes (DashboardLayout) ───────────────── */}
      <Route element={<RoleRoute roles={['organizer', 'admin']}><DashboardLayout /></RoleRoute>}>
        <Route path="/dashboard" element={<OrganizerDashboard />} />
        <Route path="/dashboard/events" element={<MyEvents />} />
        <Route path="/dashboard/events/new" element={<CreateEvent />} />
        <Route path="/dashboard/events/:id/edit" element={<EditEvent />} />
        <Route path="/dashboard/events/:id/tickets" element={<ManageTickets />} />
      </Route>

      {/* ── Admin Routes (AdminLayout) ───────────────────────── */}
      <Route element={<RoleRoute roles={['admin']}><AdminLayout /></RoleRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/events" element={<ManageEvents />} />
      </Route>
    </Routes>
  );
}
