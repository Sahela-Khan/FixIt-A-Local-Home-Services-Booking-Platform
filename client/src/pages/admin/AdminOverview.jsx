import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then((res) => setStats(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load analytics.")
      );
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!stats) return <p className="muted">Loading analytics…</p>;

  const cards = [
    { label: "Total users", value: stats.totalUsers },
    { label: "Customers", value: stats.customers },
    { label: "Providers", value: stats.providers },
    { label: "Pending approvals", value: stats.pendingServices },
    { label: "Live services", value: stats.approvedServices },
    { label: "Total services", value: stats.totalServices },
  ];

  return (
    <>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat" key={c.label}>
            <span className="stat-value">{c.value}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <h3 className="section-title">Recently joined</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {stats.recentUsers.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge badge-${u.role}`}>{u.role}</span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
