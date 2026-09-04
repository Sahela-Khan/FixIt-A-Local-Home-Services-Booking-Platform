import { useState } from "react";
import { LayoutDashboard, Users, ShieldCheck, Megaphone } from "lucide-react";
import Sidebar from "../components/Sidebar";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminApprovals from "./admin/AdminApprovals";
import AdminBroadcast from "../components/AdminBroadcast";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const menu = [
    { name: "Overview", icon: LayoutDashboard, tab: "overview" },
    { name: "Users", icon: Users, tab: "users" },
    { name: "Approvals", icon: ShieldCheck, tab: "approvals" },
    { name: "Broadcast", icon: Megaphone, tab: "broadcast" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsers />;
      case "approvals":
        return <AdminApprovals />;
      case "broadcast":
        return <AdminBroadcast />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} menu={menu} />
      <div className="flex-1 bg-slate-50 p-8">{renderContent()}</div>
    </div>
  );
}