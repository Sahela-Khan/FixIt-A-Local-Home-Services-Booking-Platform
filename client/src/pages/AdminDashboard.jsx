import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <h2>Admin panel</h2>
      <p className="muted">Logged in as {user?.name}.</p>
      <div className="card-grid">
        <div className="card"><h3>Users</h3><p>User management (Feature 9) will live here.</p></div>
        <div className="card"><h3>Service approvals</h3><p>Pending listings (Feature 9) will live here.</p></div>
        <div className="card"><h3>Categories</h3><p>Category management (Feature 20) will live here.</p></div>
      </div>
    </div>
  );
}
