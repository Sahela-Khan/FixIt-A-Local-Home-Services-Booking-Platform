import { useAuth } from "../context/AuthContext";

export default function CustomerDashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <h2>Welcome, {user?.name}</h2>
      <p className="muted">You are logged in as a customer.</p>
      <div className="card-grid">
        <div className="card"><h3>Find services</h3><p>Search &amp; filter (Feature 4) will live here.</p></div>
        <div className="card"><h3>My bookings</h3><p>Active bookings &amp; history (Feature 7) will live here.</p></div>
        <div className="card"><h3>Loyalty points</h3><p>Points balance (Feature 19) will live here.</p></div>
      </div>
    </div>
  );
}
