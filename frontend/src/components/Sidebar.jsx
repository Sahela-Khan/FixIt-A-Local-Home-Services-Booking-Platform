import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ProfileCard from "./ProfileCard";

export default function Sidebar({ activeTab, setActiveTab, menu }) {
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-slate-900 text-white h-screen sticky top-0 flex flex-col justify-between p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Fix<span className="text-orange-500">It</span>
        </h1>
        <p className="text-xs text-slate-400 mb-4">Home Services</p>

        <ProfileCard />

        <nav className="space-y-1">
          {menu.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition text-left ${
                activeTab === item.tab
                  ? "bg-orange-500 text-white font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-3">
                <item.icon size={18} />
                {item.name}
              </span>
              {item.badge !== undefined && (
                <span
                  className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                    activeTab === item.tab ? "bg-white/20" : "bg-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div>
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
