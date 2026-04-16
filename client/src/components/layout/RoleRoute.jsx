import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuth, selectUserRole } from '../../features/auth/authSlice';
import ProtectedRoute from './ProtectedRoute';

export default function RoleRoute({ children, roles = [] }) {
  const role = useSelector(selectUserRole);

  return (
    <ProtectedRoute>
      {roles.length === 0 || roles.includes(role) ? (
        children
      ) : (
        <Navigate to="/" replace />
      )}
    </ProtectedRoute>
  );
}
