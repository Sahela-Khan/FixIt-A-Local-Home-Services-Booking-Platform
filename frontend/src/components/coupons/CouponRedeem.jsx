import { useEffect, useState } from "react";
import api from "../../api/axios";

const FIELD =
  "w-full rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.55rem] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";
const LABEL = "mb-[0.3rem] block text-[0.85rem] font-semibold";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const OKALERT =
  "mt-4 rounded-[7px] border border-[#b8dfc9] bg-[#eaf7f0] px-[0.8rem] py-[0.6rem] text-[0.9rem] text-[#1e6b45]";
const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const BTN =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";
const BTN_DARK = `${BTN} bg-ink text-white hover:bg-[#33434f]`;
const BTN_PRIMARY = `${BTN} bg-brand text-ink hover:bg-brand-dark hover:text-white`;

export default function CouponRedeem() {
  const [available, setAvailable] = useState([]);
  const [code, setCode] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [preview, setPreview] = useState(null);
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadAvailable = async () => {
    try {
      const res = await api.get("/coupons/active");
      setAvailable(res.data.coupons);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load coupons.");
    }
  };

  useEffect(() => {
    loadAvailable();
  }, []);

  const check = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError("");
    setPreview(null);
    setApplied(null);
    try {
      const res = await api.post("/coupons/validate", { code, orderAmount });
      setPreview(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not check this coupon.");
    } finally {
      setChecking(false);
    }
  };

  const apply = async () => {
    setApplying(true);
    setError("");
    try {
      const res = await api.post("/coupons/redeem", { code, orderAmount });
      setApplied(res.data);
      setPreview(null);
      await loadAvailable();
    } catch (err) {
      setError(err.response?.data?.message || "Could not apply this coupon.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <form
        className="rounded-lg border border-line bg-surface p-6"
        onSubmit={check}
      >
        <h3 className="m-0 mb-1 text-[1.17rem] font-bold">Apply a discount code</h3>
        <p className={MUTED}>
          Enter your booking amount and a code to see what you would pay.
        </p>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          <div>
            <label className={LABEL} htmlFor="code">Coupon code</label>
            <input
              className={FIELD}
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FIXIT20"
              maxLength={20}
              required
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="orderAmount">Booking amount</label>
            <input
              className={FIELD}
              id="orderAmount"
              type="number"
              min="1"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              placeholder="2500"
              required
            />
          </div>
        </div>

        {error && <div className={ALERT}>{error}</div>}

        {preview && (
          <div className="mt-4 rounded-[7px] border border-line bg-[#fbfaf7] p-4">
            <p className="m-0 text-[0.9rem] text-ink-soft">
              {preview.code}
              {preview.description ? ` — ${preview.description}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-4">
              <span className="text-[0.9rem] text-ink-soft">
                Booking ৳{preview.orderAmount}
              </span>
              <span className="text-[0.9rem] font-semibold text-[#1e6b45]">
                You save ৳{preview.discount}
              </span>
              <span className="text-[1.4rem] font-extrabold text-ink">
                Pay ৳{preview.finalAmount}
              </span>
            </div>
          </div>
        )}

        {applied && (
          <div className={OKALERT}>
            {applied.message} You saved ৳{applied.discount}. Final amount ৳
            {applied.finalAmount}.
          </div>
        )}

        <div className="mt-5 flex justify-end gap-[0.6rem]">
          <button className={BTN_DARK} type="submit" disabled={checking}>
            {checking ? "Checking…" : "Check code"}
          </button>
          {preview && (
            <button
              className={BTN_PRIMARY}
              type="button"
              onClick={apply}
              disabled={applying}
            >
              {applying ? "Applying…" : "Apply coupon"}
            </button>
          )}
        </div>
      </form>

      <h3 className="mb-3 mt-8 text-[1.1rem] font-bold">Available offers</h3>

      {available.length === 0 ? (
        <p className={MUTED}>There are no active offers right now.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {available.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setCode(c.code)}
              className="cursor-pointer rounded-lg border border-line border-l-4 border-l-brand bg-surface px-[1.4rem] py-5 text-left hover:border-l-brand-dark"
            >
              <span className="block text-[1.05rem] font-bold">{c.code}</span>
              <span className="block text-[0.92rem] text-ink-soft">
                {c.discountType === "percentage"
                  ? `${c.discountValue}% off`
                  : `৳${c.discountValue} off`}
                {c.discountType === "percentage" && c.maxDiscountAmount
                  ? ` up to ৳${c.maxDiscountAmount}`
                  : ""}
              </span>
              {c.description && (
                <span className="mt-1 block text-[0.85rem] text-ink-soft">
                  {c.description}
                </span>
              )}
              <span className="mt-2 block text-[0.8rem] text-ink-soft">
                Minimum order ৳{c.minOrderAmount} · expires{" "}
                {new Date(c.validUntil).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
