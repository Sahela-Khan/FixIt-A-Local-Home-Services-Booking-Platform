import { useState } from "react";
import { LayoutDashboard, UserCircle, Star, Bell, MessageCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ProviderOverview from "../components/ProviderOverview";
import ProviderProfile from "./ProviderProfile";
import ProviderReviews from "../components/ProviderReviews";
import Notifications from "../components/Notifications";
import Chat from "./Chat";

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, tab: "dashboard" },
    { name: "My Profile Setup", icon: UserCircle, tab: "profile" },
    { name: "Rating and Review", icon: Star, tab: "reviews" },
    { name: "Notifications", icon: Bell, tab: "notifications" },
    { name: "Messages", icon: MessageCircle, tab: "chat" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ProviderOverview />;
      case "profile":
        return <ProviderProfile embedded />;
      case "reviews":
        return <ProviderReviews />;
      case "notifications":
        return <Notifications />;
      case "chat":
        return <Chat />;
      default:
        return <ProviderOverview />;
    }
  };

  return (
    <div className="flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} menu={menu} />
      <div className="flex-1 bg-slate-50">{renderContent()}</div>
    </div>
  );
}
