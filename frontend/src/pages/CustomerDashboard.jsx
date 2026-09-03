import { useState, useEffect } from "react";
import { LayoutDashboard, Search, CreditCard, MessageSquareText, Bell, MessageCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import SearchAndBook from "../components/SearchAndBook";
import PaymentsRewardsCancellation from "../components/PaymentsRewardsCancellation";
import MyReviews from "../components/MyReviews";
import Notifications from "../components/Notifications";
import Chat from "./Chat";
import api from "../api/axios";

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    api
      .get("/reviews/mine")
      .then((res) => setReviewCount(res.data.myReviews?.length || 0))
      .catch(() => {});
  }, []);

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, tab: "dashboard" },
    { name: "Search & Book", icon: Search, tab: "search" },
    { name: "Payments, Rewards & Cancellation", icon: CreditCard, tab: "payments" },
    { name: "Ratings & Reviews", icon: MessageSquareText, tab: "reviews", badge: reviewCount },
    { name: "Notifications", icon: Bell, tab: "notifications" },
    { name: "Messages", icon: MessageCircle, tab: "chat" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard setActiveTab={setActiveTab} reviewCount={reviewCount} />;
      case "search":
        return <SearchAndBook />;
      case "payments":
        return <PaymentsRewardsCancellation />;
      case "reviews":
        return <MyReviews />;
      case "notifications":
        return <Notifications />;
      case "chat":
        return <Chat />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} menu={menu} />
      {renderContent()}
    </div>
  );
}
