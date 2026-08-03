import { useAuth } from "../context/AuthContext";

const CARD =
  "rounded-lg border border-line border-l-4 border-l-brand bg-surface px-[1.4rem] py-5";
const CARD_TITLE = "m-0 mb-[0.4rem] text-[1.05rem] font-bold";
const CARD_TEXT = "m-0 text-[0.92rem] text-ink-soft";

export default function CustomerDashboard() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10">
      <h2 className="mb-1 text-2xl font-bold">Welcome, {user?.name}</h2>
      <p className="mt-0 text-[0.95rem] text-ink-soft">
        You are logged in as a customer.
      </p>
      <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
        <div className={CARD}>
          <h3 className={CARD_TITLE}>Find services</h3>
          <p className={CARD_TEXT}>Search &amp; filter (Feature 4) will live here.</p>
        </div>
        <div className={CARD}>
          <h3 className={CARD_TITLE}>My bookings</h3>
          <p className={CARD_TEXT}>Active bookings &amp; history (Feature 7) will live here.</p>
        </div>
        <div className={CARD}>
          <h3 className={CARD_TITLE}>Loyalty points</h3>
          <p className={CARD_TEXT}>Points balance (Feature 19) will live here.</p>
        </div>
      </div>
    </div>
  );
}
