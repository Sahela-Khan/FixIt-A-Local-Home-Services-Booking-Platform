import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth, roleHome } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });
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
      const res = await api.post("/auth/register", form);
      login(res.data.token, res.data.user);
      navigate(roleHome(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Is the server running?");
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
          <h2>Create your account</h2>
          <p className="muted">Join FixIt as a customer or a service provider.</p>

          {error && <div className="alert">{error}</div>}

          <label htmlFor="name">Full name</label>
          <input
            id="name" name="name" type="text" value={form.name}
            onChange={handleChange} placeholder="e.g. Rezauddin Ahmed" required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email" name="email" type="email" value={form.email}
            onChange={handleChange} placeholder="you@example.com" required
          />

          <label htmlFor="phone">Phone</label>
          <input
            id="phone" name="phone" type="tel" value={form.phone}
            onChange={handleChange} placeholder="01XXXXXXXXX" required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="At least 6 characters"
            minLength={6} required
          />

          <label htmlFor="role">I want to</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value="customer">Book services (Customer)</option>
            <option value="provider">Offer services (Service Provider)</option>
          </select>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="switch-link">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
