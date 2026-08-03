import { useState } from "react";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminApprovals from "./admin/AdminApprovals";

const TABS = ["Overview", "Users", "Approvals"];

const TAB_BASE =
  "-mb-[2px] cursor-pointer border-0 border-b-[3px] border-transparent bg-none px-4 py-[0.6rem] font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10">
      <h2 className="mb-1 text-2xl font-bold">Admin panel</h2>
      <div className="mb-7 mt-5 flex gap-2 border-b-2 border-line">
        {TABS.map((t) => (
          <button
            key={t}
            className={
              t === tab
                ? `${TAB_BASE} border-b-brand text-ink`
                : `${TAB_BASE} text-ink-soft hover:text-ink`
            }
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" && <AdminOverview />}
      {tab === "Users" && <AdminUsers />}
      {tab === "Approvals" && <AdminApprovals />}
    </div>
  );
}
