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

const FIELD =
  "w-full rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.55rem] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";
const LABEL = "mb-[0.3rem] block text-[0.85rem] font-semibold";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const OKALERT =
  "mt-4 rounded-[7px] border border-[#b8dfc9] bg-[#eaf7f0] px-[0.8rem] py-[0.6rem] text-[0.9rem] text-[#1e6b45]";
const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const BTN_DARK =
  "cursor-pointer rounded-lg bg-ink px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold text-white transition-colors duration-150 hover:bg-[#33434f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";

const EMPTY = {
  subject: "",
  category: "service quality",
  againstProvider: "",
  serviceName: "",
  description: "",
};

export default function DisputeSubmit() {
  const [form, setForm] = useState(EMPTY);
  const [providers, setProviders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const [mine, prov] = await Promise.all([
        api.get("/disputes/mine"),
        api.get("/disputes/providers"),
      ]);
      setDisputes(mine.data.disputes);
      setProviders(prov.data.providers);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await api.post("/disputes", form);
      setNotice(`Complaint submitted. Reference ${res.data.dispute._id.slice(-6).toUpperCase()}.`);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit your complaint.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form className="rounded-lg border border-line bg-surface p-6" onSubmit={submit}>
        <h3 className="m-0 mb-1 text-[1.17rem] font-bold">Report a problem</h3>
        <p className={MUTED}>
          Tell us what went wrong and an administrator will look into it.
        </p>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div>
            <label className={LABEL} htmlFor="subject">Subject</label>
            <input
              className={FIELD}
              id="subject"
              name="subject"
              value={form.subject}
              onChange={change}
              placeholder="Short summary of the problem"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="category">What went wrong</label>
            <select
              className={FIELD}
              id="category"
              name="category"
              value={form.category}
              onChange={change}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor="againstProvider">Service provider</label>
            <select
              className={FIELD}
              id="againstProvider"
              name="againstProvider"
              value={form.againstProvider}
              onChange={change}
            >
              <option value="">Not about a specific provider</option>
              {providers.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor="serviceName">Service (optional)</label>
            <input
              className={FIELD}
              id="serviceName"
              name="serviceName"
              value={form.serviceName}
              onChange={change}
              placeholder="AC Servicing"
              maxLength={120}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL} htmlFor="description">What happened</label>
          <textarea
            className={`${FIELD} min-h-[120px]`}
            id="description"
            name="description"
            value={form.description}
            onChange={change}
            placeholder="Describe the problem with as much detail as you can, including dates and what was agreed."
            maxLength={2000}
            required
          />
          <p className="mb-0 mt-[0.3rem] text-[0.8rem] text-ink-soft">
            {form.description.length} of 2000 characters, minimum 20
          </p>
        </div>

        {error && <div className={ALERT}>{error}</div>}
        {notice && <div className={OKALERT}>{notice}</div>}

        <div className="mt-5 flex justify-end">
          <button className={BTN_DARK} type="submit" disabled={saving}>
            {saving ? "Submitting…" : "Submit complaint"}
          </button>
        </div>
      </form>

      <h3 className="mb-3 mt-8 text-[1.1rem] font-bold">Your complaints</h3>

      {loading ? (
        <p className={MUTED}>Loading…</p>
      ) : disputes.length === 0 ? (
        <p className={MUTED}>You have not reported any problems yet.</p>
      ) : (
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
                {d.againstProvider && <span>about {d.againstProvider.name}</span>}
                {d.serviceName && <span>{d.serviceName}</span>}
                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                <span>ref {d._id.slice(-6).toUpperCase()}</span>
              </div>
              <p className="mb-0 mt-3 text-[0.92rem]">{d.description}</p>
              {d.resolution && (
                <div className="mt-3 rounded-[7px] border border-line bg-[#fbfaf7] p-3">
                  <p className="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                    Administrator response
                  </p>
                  <p className="mb-0 mt-1 text-[0.92rem]">{d.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
