import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth, roleHome } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      navigate(roleHome(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <h1 className="brand-mark">Fix<span>It</span></h1>
        <p className="brand-tag">Local home services, booked in minutes.</p>
        <ul className="brand-points">
          <li>Verified electricians, plumbers &amp; cleaners</li>
          <li>Track every job in real time</li>
          <li>Pay online, get a proper invoice</li>
        </ul>
      </aside>

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Welcome back</h2>
          <p className="muted">Log in to manage your bookings.</p>

          {error && <div className="alert">{error}</div>}

          <label htmlFor="email">Email</label>
          <input
            id="email" name="email" type="email" value={form.email}
            onChange={handleChange} placeholder="you@example.com" required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="Your password" required
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="switch-link">
            New to FixIt? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
