import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../features/auth/authSlice';
import { FullPageSpinner } from '../ui/Spinner';

export default function ProtectedRoute({ children }) {
  const isAuth   = useSelector(selectIsAuth);
  const location = useLocation();

  // If a token exists in localStorage the redux state will already be set on mount.
  // No async loading needed — just check.
  if (!isAuth) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}
