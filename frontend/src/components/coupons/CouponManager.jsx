import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const FIELD =
  "w-full rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.55rem] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";
const LABEL = "mb-[0.3rem] block text-[0.85rem] font-semibold";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const OKALERT =
  "mt-4 rounded-[7px] border border-[#b8dfc9] bg-[#eaf7f0] px-[0.8rem] py-[0.6rem] text-[0.9rem] text-[#1e6b45]";
const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const TABLE =
  "w-full border-collapse overflow-hidden rounded-lg border border-line bg-surface text-[0.92rem] max-[700px]:block max-[700px]:overflow-x-auto";
const TH = "bg-ink px-[0.9rem] py-[0.65rem] text-left font-semibold text-white";
const TD = "border-t border-line px-[0.9rem] py-[0.65rem] align-middle";
const BTN =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";
const BTN_DARK = `${BTN} bg-ink text-white hover:bg-[#33434f]`;
const BTN_OUTLINE = `${BTN} border border-line bg-transparent text-ink hover:border-ink`;
const BTN_DANGER = `${BTN} bg-[#c0392b] text-white hover:bg-[#a03024]`;
const BADGE =
  "inline-block rounded-full px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em]";

const EMPTY = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  usageLimit: "",
  perUserLimit: "1",
  validUntil: "",
};

export default function CouponManager() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    try {
      const res = await api.get("/coupons");
      setCoupons(res.data.coupons);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load coupons.");
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
      const res = await api.post("/coupons", form);
      setNotice(`Coupon ${res.data.coupon.code} created.`);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    setBusyId(coupon._id);
    setError("");
    setNotice("");
    try {
      await api.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update coupon.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code} permanently?`)) return;
    setBusyId(coupon._id);
    setError("");
    setNotice("");
    try {
      await api.delete(`/coupons/${coupon._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete coupon.");
    } finally {
      setBusyId(null);
    }
  };

  const statusOf = (c) => {
    if (!c.isActive) return { text: "inactive", tone: "bg-[#eceae4] text-ink-soft" };
    if (new Date(c.validUntil) < new Date())
      return { text: "expired", tone: "bg-[#fdecec] text-[#a03030]" };
    if (c.usageLimit && c.usedCount >= c.usageLimit)
      return { text: "used up", tone: "bg-[#fdeed3] text-[#a06a04]" };
    return { text: "active", tone: "bg-[#e4f6ea] text-[#1e6b45]" };
  };

  return (
    <>
      <form
        className="rounded-lg border border-line bg-surface p-6"
        onSubmit={submit}
      >
        <h3 className="m-0 mb-1 text-[1.17rem] font-bold">Create a coupon</h3>
        <p className={MUTED}>
          Codes are stored in uppercase and must be unique across the platform.
        </p>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          <div>
            <label className={LABEL} htmlFor="code">Code</label>
            <input
              className={FIELD}
              id="code"
              name="code"
              value={form.code}
              onChange={change}
              placeholder="FIXIT20"
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="discountType">Discount type</label>
            <select
              className={FIELD}
              id="discountType"
              name="discountType"
              value={form.discountType}
              onChange={change}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor="discountValue">
              {form.discountType === "percentage" ? "Percent off" : "Amount off"}
            </label>
            <input
              className={FIELD}
              id="discountValue"
              name="discountValue"
              type="number"
              min="1"
              value={form.discountValue}
              onChange={change}
              placeholder={form.discountType === "percentage" ? "20" : "500"}
              required
            />
          </div>

          {form.discountType === "percentage" && (
            <div>
              <label className={LABEL} htmlFor="maxDiscountAmount">
                Maximum discount
              </label>
              <input
                className={FIELD}
                id="maxDiscountAmount"
                name="maxDiscountAmount"
                type="number"
                min="0"
                value={form.maxDiscountAmount}
                onChange={change}
                placeholder="No cap"
              />
            </div>
          )}

          <div>
            <label className={LABEL} htmlFor="minOrderAmount">Minimum order</label>
            <input
              className={FIELD}
              id="minOrderAmount"
              name="minOrderAmount"
              type="number"
              min="0"
              value={form.minOrderAmount}
              onChange={change}
              placeholder="0"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="usageLimit">Total uses</label>
            <input
              className={FIELD}
              id="usageLimit"
              name="usageLimit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={change}
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="perUserLimit">Uses per customer</label>
            <input
              className={FIELD}
              id="perUserLimit"
              name="perUserLimit"
              type="number"
              min="1"
              value={form.perUserLimit}
              onChange={change}
              required
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="validUntil">Expires on</label>
            <input
              className={FIELD}
              id="validUntil"
              name="validUntil"
              type="date"
              value={form.validUntil}
              onChange={change}
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL} htmlFor="description">Description</label>
          <input
            className={FIELD}
            id="description"
            name="description"
            value={form.description}
            onChange={change}
            placeholder="20 percent off any service"
            maxLength={200}
          />
        </div>

        {error && <div className={ALERT}>{error}</div>}
        {notice && <div className={OKALERT}>{notice}</div>}

        <div className="mt-5 flex justify-end">
          <button className={BTN_DARK} type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create coupon"}
          </button>
        </div>
      </form>

      <h3 className="mb-3 mt-8 text-[1.1rem] font-bold">
        {isAdmin ? "All coupons" : "Your coupons"}
      </h3>

      {loading ? (
        <p className={MUTED}>Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <p className={MUTED}>No coupons yet. Create one using the form above.</p>
      ) : (
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Code</th>
              <th className={TH}>Discount</th>
              <th className={TH}>Conditions</th>
              <th className={TH}>Used</th>
              <th className={TH}>Expires</th>
              {isAdmin && <th className={TH}>Created by</th>}
              <th className={TH}>Status</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => {
              const status = statusOf(c);
              return (
                <tr className="even:bg-[#fbfaf7]" key={c._id}>
                  <td className={TD}>
                    <span className="font-bold">{c.code}</span>
                    {c.description && (
                      <span className="block text-[0.8rem] text-ink-soft">
                        {c.description}
                      </span>
                    )}
                  </td>
                  <td className={TD}>
                    {c.discountType === "percentage"
                      ? `${c.discountValue}%`
                      : `৳${c.discountValue}`}
                    {c.discountType === "percentage" && c.maxDiscountAmount ? (
                      <span className="block text-[0.8rem] text-ink-soft">
                        max ৳{c.maxDiscountAmount}
                      </span>
                    ) : null}
                  </td>
                  <td className={TD}>
                    <span className="text-[0.85rem] text-ink-soft">
                      min order ৳{c.minOrderAmount}
                      <br />
                      {c.perUserLimit} per customer
                    </span>
                  </td>
                  <td className={TD}>
                    {c.usedCount}/{c.usageLimit || "unlimited"}
                  </td>
                  <td className={TD}>
                    {new Date(c.validUntil).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className={TD}>
                      {c.createdBy?.name}
                      <span className="block text-[0.8rem] text-ink-soft">
                        {c.creatorRole}
                      </span>
                    </td>
                  )}
                  <td className={TD}>
                    <span className={`${BADGE} ${status.tone}`}>{status.text}</span>
                  </td>
                  <td className={TD}>
                    <div className="flex gap-[0.4rem]">
                      <button
                        className={BTN_OUTLINE}
                        disabled={busyId === c._id}
                        onClick={() => toggleActive(c)}
                      >
                        {c.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        className={BTN_DANGER}
                        disabled={busyId === c._id}
                        onClick={() => remove(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
