import { useState } from "react";
import { LayoutDashboard, Users, ShieldCheck, Star, Banknote, ShieldAlert, Tags, Ticket } from "lucide-react";
import Sidebar from "../components/Sidebar";
import AdminOverview from "./admin/AdminOverview";
import AdminUsers from "./admin/AdminUsers";
import AdminApprovals from "./admin/AdminApprovals";
import AdminReviews from "./admin/AdminReviews";
import AdminRefunds from "./admin/AdminRefunds";
import AdminDisputes from "./admin/AdminDisputes";
import AdminCategories from "./admin/AdminCategories";
import AdminCoupons from "./admin/AdminCoupons";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const menu = [
    { name: "Overview", icon: LayoutDashboard, tab: "overview" },
    { name: "Users", icon: Users, tab: "users" },
    { name: "Approvals", icon: ShieldCheck, tab: "approvals" },
    { name: "Reviews", icon: Star, tab: "reviews" },
    { name: "Refunds", icon: Banknote, tab: "refunds" },
    { name: "Disputes", icon: ShieldAlert, tab: "disputes" },
    { name: "Categories", icon: Tags, tab: "categories" },
    { name: "Coupons", icon: Ticket, tab: "coupons" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsers />;
      case "approvals":
        return <AdminApprovals />;
      case "reviews":
        return <AdminReviews />;
      case "refunds":
        return <AdminRefunds />;
      case "disputes":
        return <AdminDisputes />;
      case "categories":
        return <AdminCategories />;
      case "coupons":
        return <AdminCoupons />;
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
