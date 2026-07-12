import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminApprovals() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .get("/admin/services/pending")
      .then((res) => setServices(res.data.services))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Failed to load pending services."
        )
      );
  }, []);

  const review = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await api.put(`/admin/services/${id}/${action}`);
      setServices((list) => list.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (error && !services) return <div className="alert">{error}</div>;
  if (!services) return <p className="muted">Loading pending services…</p>;

  return (
    <>
      {error && <div className="alert">{error}</div>}
      {services.length === 0 ? (
        <p className="muted">
          No services waiting for review. New listings from providers will
          appear here.
        </p>
      ) : (
        <div className="approval-list">
          {services.map((s) => (
            <div className="approval-card" key={s._id}>
              <div className="approval-info">
                <h3>{s.title}</h3>
                {s.description && <p className="muted">{s.description}</p>}
                <div className="approval-meta">
                  <span className="badge badge-pending">pending</span>
                  <span>{s.category}</span>
                  <span>৳{s.price}</span>
                  {s.estDurationMins ? (
                    <span>{s.estDurationMins} mins</span>
                  ) : null}
                  <span>
                    by {s.provider?.name} ({s.provider?.email})
                  </span>
                </div>
              </div>
              <div className="approval-actions">
                <button
                  className="btn btn-small btn-approve"
                  disabled={busyId === s._id}
                  onClick={() => review(s._id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="btn btn-small btn-danger"
                  disabled={busyId === s._id}
                  onClick={() => review(s._id, "reject")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
