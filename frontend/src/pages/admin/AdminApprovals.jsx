import { useEffect, useState } from "react";
import api from "../../api/axios";

const ALERT =
  "mt-4 rounded-[7px] border border-red-200 bg-red-50 px-[0.8rem] py-[0.6rem] text-[0.9rem] text-red-600";
const BTN_SMALL =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";

export default function AdminApprovals() {
  const [services, setServices] = useState(null);
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadServices = () =>
    api
      .get("/admin/services/pending")
      .then((res) => setServices(res.data.services))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load pending services.")
      );

  const loadProviders = () =>
    api
      .get("/admin/providers/nids")
      .then((res) => setProviders(res.data.providers))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load provider NIDs.")
      );

  useEffect(() => {
    loadServices();
    loadProviders();
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

  const toggleSuspend = async (id, suspend) => {
    if (suspend) {
      const raw = window.prompt("Reason for suspending this provider (optional):");
      if (raw === null) return; // cancelled
      const reason = raw || "";
      setBusyId(id);
      setError("");
      try {
        const res = await api.put(`/admin/providers/${id}/suspend`, { reason });
        setProviders((list) => list.map((p) => (p._id === id ? res.data.provider : p)));
      } catch (err) {
        setError(err.response?.data?.message || "Action failed.");
      } finally {
        setBusyId(null);
      }
      return;
    }
    setBusyId(id);
    setError("");
    try {
      const res = await api.put(`/admin/providers/${id}/unsuspend`);
      setProviders((list) => list.map((p) => (p._id === id ? res.data.provider : p)));
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const loading = !services || !providers;
  if (error && loading) return <div className={ALERT}>{error}</div>;
  if (loading)
    return (
      <p className="mt-0 text-[0.95rem] text-slate-500">Loading pending approvals…</p>
    );

  return (
    <>
      {error && <div className={ALERT}>{error}</div>}

      <h3 className="m-0 mb-3 text-[1.05rem] font-bold">Provider NIDs on file</h3>
      {providers.length === 0 ? (
        <p className="mt-0 mb-6 text-[0.95rem] text-slate-500">
          No providers have uploaded an NID yet.
        </p>
      ) : (
        <div className="mb-8 flex flex-col gap-4">
          {providers.map((p) => (
            <div
              className={`flex items-center justify-between gap-4 rounded-lg border bg-white px-[1.3rem] py-[1.1rem] max-[700px]:flex-col max-[700px]:items-stretch ${
                p.providerProfile?.suspended
                  ? "border-red-200 border-l-4 border-l-[#c0392b]"
                  : "border-slate-200"
              }`}
              key={p._id}
            >
              <div className="flex items-center gap-4">
                {p.providerProfile?.nidPhotoUrl && (
                  <img
                    src={p.providerProfile.nidPhotoUrl}
                    alt="NID"
                    className="w-16 h-16 rounded-lg object-cover border shrink-0"
                  />
                )}
                <div>
                  <h3 className="m-0 mb-[0.3rem] text-[1.05rem] font-bold">{p.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[0.85rem] text-slate-500">
                    {p.providerProfile?.suspended && (
                      <span className="inline-block rounded-full bg-red-100 px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-red-700">
                        suspended
                      </span>
                    )}
                    <span>{p.email}</span>
                  </div>
                  {p.providerProfile?.suspended && p.providerProfile?.suspensionReason && (
                    <p className="mt-1 text-[0.8rem] text-red-600">
                      Reason: {p.providerProfile.suspensionReason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2 max-[700px]:justify-end">
                {p.providerProfile?.suspended ? (
                  <button
                    className={`${BTN_SMALL} bg-[#1e8e5a] text-white hover:bg-[#177248]`}
                    disabled={busyId === p._id}
                    onClick={() => toggleSuspend(p._id, false)}
                  >
                    Unsuspend
                  </button>
                ) : (
                  <button
                    className={`${BTN_SMALL} bg-[#c0392b] text-white hover:bg-[#a03024]`}
                    disabled={busyId === p._id}
                    onClick={() => toggleSuspend(p._id, true)}
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="m-0 mb-3 text-[1.05rem] font-bold">Service listing approvals</h3>
      {services.length === 0 ? (
        <p className="mt-0 text-[0.95rem] text-slate-500">
          No services waiting for review. New listings from providers will
          appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {services.map((s) => (
            <div
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 border-l-4 border-l-brand bg-white px-[1.3rem] py-[1.1rem] max-[700px]:flex-col max-[700px]:items-stretch"
              key={s._id}
            >
              <div>
                <h3 className="m-0 mb-[0.3rem] text-[1.05rem] font-bold">
                  {s.title}
                </h3>
                {s.description && (
                  <p className="m-0 mb-2 text-[0.95rem] text-slate-500">
                    {s.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[0.85rem] text-slate-500">
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
