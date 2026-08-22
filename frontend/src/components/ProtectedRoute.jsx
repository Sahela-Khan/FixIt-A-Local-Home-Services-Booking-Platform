import { Navigate } from "react-router-dom";
import { useAuth, roleHome } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {

    return <Navigate to={roleHome(user?.role)} replace />;
  }

  return children;
}
