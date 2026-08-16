import { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminApprovals from "./admin/AdminApprovals";
import AdminCoupons from "./admin/AdminCoupons";

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");

  const renderContent = () => {
    if (tab === "Users") return <AdminUsers />;
    if (tab === "Approvals") return <AdminApprovals />;
    if (tab === "Coupons") return <AdminCoupons />;
    return <AdminOverview />;
  };

  return (
    <div className="flex">
      <AdminSidebar activeTab={tab} setActiveTab={setTab} />
      <div className="min-h-screen flex-1 bg-paper p-8">
        <h2 className="mb-1 text-2xl font-bold">{tab}</h2>
        <p className="mb-7 mt-0 text-[0.95rem] text-ink-soft">
          Manage the FixIt platform from a single place.
        </p>
        {renderContent()}
      </div>
    </div>
  );
}
