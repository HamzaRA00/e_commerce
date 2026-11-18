import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function GuestRoute() {
  const { isAuthenticated, isUser } = useAuth();
  if (isAuthenticated) {
    if (isUser) return <Navigate to="/orders" replace />;
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export function ProtectedRoute({ role = 'user' }) {
  const { isAuthenticated, auth } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || auth?.role !== role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
