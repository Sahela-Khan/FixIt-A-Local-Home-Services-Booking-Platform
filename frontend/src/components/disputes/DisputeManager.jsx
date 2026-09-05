import { useEffect, useState } from "react";
import api from "../../api/axios";
import DisputeStatusBadge from "./DisputeStatusBadge";

const CATEGORIES = [
  "service quality",
  "payment",
  "provider behaviour",
  "provider did not arrive",
  "property damage",
  "other",
];
const STATUSES = ["open", "under review", "resolved", "rejected"];

const FIELD =
  "rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.55rem] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const BTN =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";
const BTN_DARK = `${BTN} bg-ink text-white hover:bg-[#33434f]`;
const BTN_OUTLINE = `${BTN} border border-line bg-transparent text-ink hover:border-ink`;
const BTN_OK = `${BTN} bg-[#1e8e5a] text-white hover:bg-[#177248]`;
const BTN_NO = `${BTN} bg-[#c0392b] text-white hover:bg-[#a03024]`;

export default function DisputeManager() {
  const [data, setData] = useState({ disputes: [], total: 0, page: 1, pages: 1 });
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState({ status: "", category: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [list, st] = await Promise.all([
        api.get("/disputes", { params: query }),
        api.get("/disputes/stats"),
      ]);
      setData(list.data);
      setStats(st.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  const decide = async (status) => {
    setBusy(true);
    setError("");
    try {
      await api.put(`/disputes/${active._id}/resolve`, { status, resolution: note });
      setActive(null);
      setNote("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update this complaint.");
    } finally {
      setBusy(false);
    }
  };

  const cards = stats
    ? [
        { label: "Open", value: stats.open },
        { label: "Under review", value: stats.underReview },
        { label: "Resolved", value: stats.resolved },
        { label: "Rejected", value: stats.rejected },
      ]
    : [];

  return (
    <>
      {stats && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          {cards.map((c) => (
            <div
              className="flex flex-col rounded-lg border border-line bg-surface px-[1.2rem] py-4"
              key={c.label}
            >
              <span className="text-[1.8rem] font-extrabold text-ink">{c.value}</span>
              <span className="text-[0.82rem] text-ink-soft">{c.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 mt-7 flex flex-wrap gap-[0.6rem]">
        <select
          className={FIELD}
          value={query.status}
          onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className={FIELD}
          value={query.category}
          onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && <div className={ALERT}>{error}</div>}

      {loading ? (
        <p className={MUTED}>Loading complaints…</p>
      ) : data.disputes.length === 0 ? (
        <p className={MUTED}>No complaints match this filter.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {data.disputes.map((d) => (
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
                <span>from {d.customer?.name}</span>
                {d.againstProvider && <span>against {d.againstProvider.name}</span>}
                {d.serviceName && <span>{d.serviceName}</span>}
                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                <span>ref {d._id.slice(-6).toUpperCase()}</span>
              </div>
              <p className="mb-0 mt-3 text-[0.92rem]">{d.description}</p>

              {d.resolution && (
                <div className="mt-3 rounded-[7px] border border-line bg-[#fbfaf7] p-3">
                  <p className="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                    Decision by {d.handledBy?.name || "administrator"}
                  </p>
                  <p className="mb-0 mt-1 text-[0.92rem]">{d.resolution}</p>
                </div>
              )}

              {d.status !== "resolved" && d.status !== "rejected" && (
                <div className="mt-4 flex gap-[0.4rem]">
                  <button className={BTN_DARK} onClick={() => { setActive(d); setNote(d.resolution || ""); }}>
                    Review and decide
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="mt-5 flex items-center gap-4">
          <button
            className={BTN_OUTLINE}
            disabled={data.page <= 1}
            onClick={() => setQuery({ ...query, page: query.page - 1 })}
          >
            Previous
          </button>
          <span className={MUTED}>
            Page {data.page} of {data.pages} ({data.total} complaints)
          </span>
          <button
            className={BTN_OUTLINE}
            disabled={data.page >= data.pages}
            onClick={() => setQuery({ ...query, page: query.page + 1 })}
          >
            Next
          </button>
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-[520px] rounded-lg bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-1 text-[1.17rem] font-bold">{active.subject}</h3>
            <p className={MUTED}>
              {active.category}, reported by {active.customer?.name}
            </p>
            <p className="mt-3 text-[0.92rem]">{active.description}</p>

            <label className="mb-[0.3rem] mt-4 block text-[0.85rem] font-semibold" htmlFor="note">
              Your decision note
            </label>
            <textarea
              className={`${FIELD} min-h-[110px] w-full`}
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain what action was taken. This is shown to the customer."
              maxLength={2000}
            />

            {error && <div className={ALERT}>{error}</div>}

            <div className="mt-5 flex flex-wrap justify-end gap-[0.6rem]">
              <button className={BTN_OUTLINE} onClick={() => setActive(null)} disabled={busy}>
                Cancel
              </button>
              <button className={BTN_DARK} onClick={() => decide("under review")} disabled={busy}>
                Mark under review
              </button>
              <button className={BTN_NO} onClick={() => decide("rejected")} disabled={busy}>
                Reject
              </button>
              <button className={BTN_OK} onClick={() => decide("resolved")} disabled={busy}>
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
