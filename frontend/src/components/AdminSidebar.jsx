import { LayoutDashboard, Users, ClipboardCheck, ShieldAlert, LogOut, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menu = [
    { name: "Overview", icon: LayoutDashboard, tab: "Overview" },
    { name: "Users", icon: Users, tab: "Users" },
    { name: "Approvals", icon: ClipboardCheck, tab: "Approvals" },
    { name: "Disputes", icon: ShieldAlert, tab: "Disputes" },
    { name: "Categories", icon: Tags, tab: "Categories" },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen sticky top-0 flex flex-col justify-between p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Fix<span className="text-orange-500">It</span>
        </h1>
        <p className="text-xs text-slate-400 mb-6">Admin Panel</p>

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
          <p className="text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-orange-400 uppercase tracking-wide">{user?.role}</p>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
