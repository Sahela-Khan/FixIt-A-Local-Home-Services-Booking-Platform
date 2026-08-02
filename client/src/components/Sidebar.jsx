import { LayoutDashboard, Search, ClipboardList, Star, XCircle, Heart, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, tab: "dashboard" },
    { name: "Search Services", icon: Search, tab: "search" },
    { name: "Book a Service", icon: ClipboardList, tab: "booking" },
    { name: "Loyalty Points", icon: Star, tab: "loyalty" },
    { name: "Cancellation Policy", icon: XCircle, tab: "cancellation" },
    { name: "Saved Providers", icon: Heart, tab: "saved" },
    { name: "Profile Settings", icon: Settings, tab: "profile" },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen sticky top-0 flex flex-col justify-between p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Fix<span className="text-orange-500">It</span>
        </h1>
        <p className="text-xs text-slate-400 mb-6">Home Services</p>

        <nav className="space-y-1">
          {menu.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition text-left ${
                activeTab === item.tab
                  ? "bg-orange-500 text-white font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <p className="text-orange-400 text-xs font-semibold mb-1">🔥 GET 10% OFF</p>
          <p className="text-sm">
            Use code: <span className="text-orange-400 font-bold">FIXIT10</span>
          </p>
          <p className="text-xs text-slate-400 mb-2">on your next booking</p>
          <button className="text-orange-400 text-sm font-semibold">Apply Now →</button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}