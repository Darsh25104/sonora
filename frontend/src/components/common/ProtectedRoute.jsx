import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingState from './LoadingState.jsx';

/**
 * Route guard.
 *   <ProtectedRoute>            → must be logged in
 *   <ProtectedRoute adminOnly>  → must be an admin/artist
 *   <ProtectedRoute inverted>   → must be logged OUT (login/register pages)
 */
export default function ProtectedRoute({ children, adminOnly = false, inverted = false }) {
  const { user, initializing, isAdmin } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="route-loading">
        <LoadingState label="Checking your session..." />
      </div>
    );
  }

  if (inverted) {
    return user ? <Navigate to="/" replace /> : children;
  }

  if (!user) {
    // After login we come back to the page the user originally wanted.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
