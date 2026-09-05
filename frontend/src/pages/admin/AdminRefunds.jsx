import { useEffect, useState } from "react";
import api from "../../api/axios";

const ALERT =
  "mt-4 rounded-[7px] border border-red-200 bg-red-50 px-[0.8rem] py-[0.6rem] text-[0.9rem] text-red-600";
const BTN_SMALL =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";

// @desc  Admin dashboard for the Refund Processing Flow (Feature 20):
//        - FR-20.2: configure the auto-partial-refund percentage
//        - FR-20.3: approve/reject refunds flagged for manual review
export default function AdminRefunds() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [approvePercent, setApprovePercent] = useState({});
  const [rejectNote, setRejectNote] = useState({});
  const [activeAction, setActiveAction] = useState(null); // `${id}:approve` | `${id}:reject`

  const [settings, setSettings] = useState(null);
  const [settingsInput, setSettingsInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const loadRequests = () =>
    api
      .get("/refund-requests", { params: { status: "Pending" } })
      .then((res) => setRequests(res.data.requests))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load refund requests.")
      );

  const loadSettings = () =>
    api
      .get("/settings/refund")
      .then((res) => {
        setSettings(res.data.partialRefundPercent);
        setSettingsInput(String(res.data.partialRefundPercent));
      })
      .catch(() => {});

  useEffect(() => {
    loadRequests();
    loadSettings();
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    const value = Number(settingsInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setSettingsMsg("Enter a number between 0 and 100.");
      return;
    }
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      await api.put("/settings/refund", { partialRefundPercent: value });
      setSettings(value);
      setSettingsMsg("Saved. New cancellations (24h+ before the job) will use this rate.");
    } catch (err) {
      setSettingsMsg(err.response?.data?.message || "Failed to save.");
    } finally {
      setSavingSettings(false);
    }
  };

  const approve = async (id) => {
    const percent = Number(approvePercent[id]);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      setError("Enter a refund percentage between 0 and 100 to approve.");
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await api.put(`/refund-requests/${id}/resolve`, { decision: "Approved", refundPercent: percent });
      setRequests((list) => list.filter((r) => r._id !== id));
      setActiveAction(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve refund.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await api.put(`/refund-requests/${id}/resolve`, {
        decision: "Rejected",
        note: rejectNote[id] || "",
      });
      setRequests((list) => list.filter((r) => r._id !== id));
      setActiveAction(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject refund.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {error && <div className={ALERT}>{error}</div>}

      <h3 className="m-0 mb-3 text-[1.05rem] font-bold">Refund settings</h3>
      <form
        onSubmit={saveSettings}
        className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-[1.3rem] py-[1.1rem]"
      >
        <label className="text-[0.9rem] text-slate-600">
          Partial refund rate for cancellations 24+ hours before the job:
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={settingsInput}
          onChange={(e) => setSettingsInput(e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-[0.9rem]"
        />
        <span className="text-[0.9rem] text-slate-500">%</span>
        <button
          type="submit"
          disabled={savingSettings}
          className={`${BTN_SMALL} bg-brand text-white hover:opacity-90`}
        >
          {savingSettings ? "Saving…" : "Save"}
        </button>
        {settingsMsg && <span className="text-[0.85rem] text-slate-500">{settingsMsg}</span>}
        {settings !== null && !settingsMsg && (
          <span className="text-[0.85rem] text-slate-400">Current: {settings}%</span>
        )}
      </form>

      <h3 className="m-0 mb-3 text-[1.05rem] font-bold">
        Refunds awaiting review
      </h3>
      {!requests ? (
        <p className="mt-0 text-[0.95rem] text-slate-500">Loading refund requests…</p>
      ) : requests.length === 0 ? (
        <p className="mt-0 text-[0.95rem] text-slate-500">
          Nothing to review right now. Refunds land here when a customer cancels
          within 24 hours of the job, or files a dispute.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <div
              className="flex flex-col gap-3 rounded-lg border border-slate-200 border-l-4 border-l-orange-500 bg-white px-[1.3rem] py-[1.1rem]"
              key={r._id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="m-0 mb-[0.2rem] text-[1rem] font-bold">
                    {r.bookingId?.service || "Booking"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[0.85rem] text-slate-500">
                    <span className="inline-block rounded-full bg-[#fdeed3] px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#a06a04]">
                      {r.source === "auto_within_24h" ? "auto-flagged: within 24h" : "customer dispute"}
                    </span>
                    <span>{r.customerId?.name}</span>
                    <span>{r.customerId?.email}</span>
                    {r.bookingId?.amount != null && <span>৳{r.bookingId.amount}</span>}
                  </div>
                </div>
              </div>
              <p className="m-0 text-[0.9rem] text-slate-700">{r.reason}</p>
              {r.proofUrl && (
                <a
                  href={r.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.85rem] text-brand underline"
                >
                  View proof
                </a>
              )}

              {activeAction === `${r._id}:approve` ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[0.85rem] text-slate-600">Refund %:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={approvePercent[r._id] ?? ""}
                    onChange={(e) =>
                      setApprovePercent((prev) => ({ ...prev, [r._id]: e.target.value }))
                    }
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-[0.9rem]"
                  />
                  <button
                    className={`${BTN_SMALL} bg-[#1e8e5a] text-white hover:bg-[#177248]`}
                    disabled={busyId === r._id}
                    onClick={() => approve(r._id)}
                  >
                    Confirm approval
                  </button>
                  <button
                    className={`${BTN_SMALL} bg-slate-100 text-slate-600 hover:bg-slate-200`}
                    onClick={() => setActiveAction(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : activeAction === `${r._id}:reject` ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Reason for rejection (optional)"
                    value={rejectNote[r._id] || ""}
                    onChange={(e) => setRejectNote((prev) => ({ ...prev, [r._id]: e.target.value }))}
                    className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-[0.9rem]"
                  />
                  <button
                    className={`${BTN_SMALL} bg-[#c0392b] text-white hover:bg-[#a03024]`}
                    disabled={busyId === r._id}
                    onClick={() => reject(r._id)}
                  >
                    Confirm rejection
                  </button>
                  <button
                    className={`${BTN_SMALL} bg-slate-100 text-slate-600 hover:bg-slate-200`}
                    onClick={() => setActiveAction(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 gap-2">
                  <button
                    className={`${BTN_SMALL} bg-[#1e8e5a] text-white hover:bg-[#177248]`}
                    onClick={() => setActiveAction(`${r._id}:approve`)}
                  >
                    Approve
                  </button>
                  <button
                    className={`${BTN_SMALL} bg-[#c0392b] text-white hover:bg-[#a03024]`}
                    onClick={() => setActiveAction(`${r._id}:reject`)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
