import { useEffect, useState } from "react";
import api from "../../api/axios";
import DisputeStatusBadge from "./DisputeStatusBadge";

const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";

export default function DisputeAgainstMe() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/disputes/against-me")
      .then((res) => setDisputes(res.data.disputes))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load complaints.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className={ALERT}>{error}</div>;
  if (loading) return <p className={MUTED}>Loading…</p>;

  if (disputes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <h3 className="m-0 mb-1 text-[1.17rem] font-bold">No complaints</h3>
        <p className={MUTED}>
          No customer has reported a problem about your services. Keep it up.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {disputes.map((d) => (
        <div
          className="rounded-lg border border-line border-l-4 border-l-brand bg-surface px-[1.3rem] py-[1.1rem]"
          key={d._id}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="m-0 text-[1.05rem] font-bold">{d.subject}</h4>
            <DisputeStatusBadge status={d.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[0.85rem] text-ink-soft">
            <span>{d.category}</span>
            {d.serviceName && <span>{d.serviceName}</span>}
            <span>{new Date(d.createdAt).toLocaleDateString()}</span>
            <span>ref {d._id.slice(-6).toUpperCase()}</span>
          </div>
          <p className="mb-0 mt-3 text-[0.92rem]">{d.description}</p>
          {d.resolution && (
            <div className="mt-3 rounded-[7px] border border-line bg-[#fbfaf7] p-3">
              <p className="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                Administrator decision
              </p>
              <p className="mb-0 mt-1 text-[0.92rem]">{d.resolution}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
