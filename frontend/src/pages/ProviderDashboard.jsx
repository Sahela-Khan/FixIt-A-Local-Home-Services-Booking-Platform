import { useAuth } from "../context/AuthContext";

const CARD =
  "rounded-lg border border-line border-l-4 border-l-brand bg-surface px-[1.4rem] py-5";
const CARD_TITLE = "m-0 mb-[0.4rem] text-[1.05rem] font-bold";
const CARD_TEXT = "m-0 text-[0.92rem] text-ink-soft";

export default function ProviderDashboard() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10">
      <h2 className="mb-1 text-2xl font-bold">Welcome, {user?.name}</h2>
      <p className="mt-0 text-[0.95rem] text-ink-soft">
        You are logged in as a service provider.
      </p>
      <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
        <div className={CARD}>
          <h3 className={CARD_TITLE}>My profile</h3>
          <p className={CARD_TEXT}>Skills, area &amp; photo setup (Feature 2) will live here.</p>
        </div>
        <div className={CARD}>
          <h3 className={CARD_TITLE}>My listings</h3>
          <p className={CARD_TEXT}>Service listings (Feature 3) will live here.</p>
        </div>
        <div className={CARD}>
          <h3 className={CARD_TITLE}>Incoming requests</h3>
          <p className={CARD_TEXT}>Booking requests &amp; earnings (Feature 8) will live here.</p>
        </div>
      </div>
    </div>
  );
}
