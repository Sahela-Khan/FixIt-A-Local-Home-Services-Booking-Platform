import { useEffect, useState } from "react";
import api from "../../api/axios";

const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const BTN_SMALL =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";

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

  if (error && !services) return <div className={ALERT}>{error}</div>;
  if (!services)
    return (
      <p className="mt-0 text-[0.95rem] text-ink-soft">Loading pending services…</p>
    );

  return (
    <>
      {error && <div className={ALERT}>{error}</div>}
      {services.length === 0 ? (
        <p className="mt-0 text-[0.95rem] text-ink-soft">
          No services waiting for review. New listings from providers will
          appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {services.map((s) => (
            <div
              className="flex items-center justify-between gap-4 rounded-lg border border-line border-l-4 border-l-brand bg-surface px-[1.3rem] py-[1.1rem] max-[700px]:flex-col max-[700px]:items-stretch"
              key={s._id}
            >
              <div>
                <h3 className="m-0 mb-[0.3rem] text-[1.05rem] font-bold">
                  {s.title}
                </h3>
                {s.description && (
                  <p className="m-0 mb-2 text-[0.95rem] text-ink-soft">
                    {s.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[0.85rem] text-ink-soft">
                  <span className="ml-[0.45rem] inline-block rounded-full bg-[#fdeed3] px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#a06a04]">
                    pending
                  </span>
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
              <div className="flex shrink-0 gap-2 max-[700px]:justify-end">
                <button
                  className={`${BTN_SMALL} bg-[#1e8e5a] text-white hover:bg-[#177248]`}
                  disabled={busyId === s._id}
                  onClick={() => review(s._id, "approve")}
                >
                  Approve
                </button>
                <button
                  className={`${BTN_SMALL} bg-[#c0392b] text-white hover:bg-[#a03024]`}
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
