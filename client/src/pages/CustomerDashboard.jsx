import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import BookingForm from "../components/BookingForm";
import CancellationPolicy from "../components/CancellationPolicy";
import SavedProviders from "../components/SavedProviders";
import ProfileSettings from "../components/ProfileSettings";

// import SearchServices from "../components/SearchServices"; // In progress — not ready yet
// import LoyaltyPoints from "../components/LoyaltyPoints"; // In progress — not ready yet

// Simple placeholder shown for features that are still being built
function ComingSoon({ title }) {
  return (
    <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-slate-500">
          🚧 This feature is currently in progress and will be available soon.
        </p>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedService, setSelectedService] = useState(null);

  const goToBooking = (service) => {
    setSelectedService(service);
    setActiveTab("booking");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard setActiveTab={setActiveTab} />;

      case "search":
        // return <SearchServices onBook={goToBooking} />; // In progress
        return <ComingSoon title="Search & Filter Services" />;

      case "booking":
        return <BookingForm selectedService={selectedService} />;

      case "loyalty":
        // return <LoyaltyPoints />; // In progress
        return <ComingSoon title="Loyalty Points" />;

      case "cancellation":
        return <CancellationPolicy />;

      case "saved":
        return <SavedProviders setActiveTab={setActiveTab} />;

      case "profile":
        return <ProfileSettings />;

      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
}