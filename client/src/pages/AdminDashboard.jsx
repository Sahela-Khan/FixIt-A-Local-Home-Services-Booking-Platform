import { useState } from "react";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminApprovals from "./admin/AdminApprovals";

const TABS = ["Overview", "Users", "Approvals"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");

  return (
    <div className="page">
      <h2>Admin panel</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab ? "tab tab-active" : "tab"}
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
