import { useAuth } from "../context/AuthContext";

export default function ProviderDashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <h2>Welcome, {user?.name}</h2>
      <p className="muted">You are logged in as a service provider.</p>
      <div className="card-grid">
        <div className="card"><h3>My profile</h3><p>Skills, area &amp; photo setup (Feature 2) will live here.</p></div>
        <div className="card"><h3>My listings</h3><p>Service listings (Feature 3) will live here.</p></div>
        <div className="card"><h3>Incoming requests</h3><p>Booking requests &amp; earnings (Feature 8) will live here.</p></div>
      </div>
    </div>
  );
}
