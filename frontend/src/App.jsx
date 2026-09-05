import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, roleHome } from "./context/AuthContext";
//import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";
import Disputes from "./pages/Disputes";
import Coupons from "./pages/Coupons";

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();
  const hasOwnSidebar = pathname.startsWith("/admin");

  return (
    <>
      {/* {!hasOwnSidebar && <Navbar />} */}
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to={roleHome(user?.role)} replace />
              : <Navigate to="/login" replace />
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/dashboard"
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={["customer", "provider"]}>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/disputes"
          element={
            <ProtectedRoute allowedRoles={["customer", "provider"]}>
              <Disputes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coupons"
          element={
            <ProtectedRoute allowedRoles={["customer", "provider"]}>
              <Coupons />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}