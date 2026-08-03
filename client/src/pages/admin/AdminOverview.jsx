import { useEffect, useState } from "react";
import api from "../../api/axios";

const TABLE =
  "w-full border-collapse overflow-hidden rounded-lg border border-line bg-surface text-[0.92rem] max-[700px]:block max-[700px]:overflow-x-auto";
const TH = "bg-ink px-[0.9rem] py-[0.65rem] text-left font-semibold text-white";
const TD = "border-t border-line px-[0.9rem] py-[0.65rem] align-middle";
const BADGE =
  "ml-[0.45rem] inline-block rounded-full px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em]";
const BADGE_TONE = {
  customer: "bg-[#e4edf6] text-[#2b5d8a]",
  provider: "bg-[#fdeed3] text-[#a06a04]",
  admin: "bg-ink text-white",
};

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then((res) => setStats(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load analytics.")
      );
  }, []);

  if (error)
    return (
      <div className="mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text">
        {error}
      </div>
    );
  if (!stats)
    return <p className="mt-0 text-[0.95rem] text-ink-soft">Loading analytics…</p>;

  const cards = [
    { label: "Total users", value: stats.totalUsers },
    { label: "Customers", value: stats.customers },
    { label: "Providers", value: stats.providers },
    { label: "Pending approvals", value: stats.pendingServices },
    { label: "Live services", value: stats.approvedServices },
    { label: "Total services", value: stats.totalServices },
  ];

  return (
    <>
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

      <h3 className="mb-3 mt-8 text-[1.1rem] font-bold">Recently joined</h3>
      <table className={TABLE}>
        <thead>
          <tr>
            <th className={TH}>Name</th>
            <th className={TH}>Email</th>
            <th className={TH}>Role</th>
            <th className={TH}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {stats.recentUsers.map((u) => (
            <tr className="even:bg-[#fbfaf7]" key={u._id}>
              <td className={TD}>{u.name}</td>
              <td className={TD}>{u.email}</td>
              <td className={TD}>
                <span className={`${BADGE} ${BADGE_TONE[u.role] || ""}`}>
                  {u.role}
                </span>
              </td>
              <td className={TD}>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
