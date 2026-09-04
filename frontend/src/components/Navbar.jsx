import { Link, useNavigate } from "react-router-dom";
import { useAuth, roleHome } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import api from "../api/axios";

const ROLE_CHIP = {
  provider: "bg-brand text-ink",
  admin: "bg-white text-ink",
  customer: "bg-white/15",
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    setDropdownOpen(false);
    if (notification.link) {
      navigate(notification.link);
    } else {
      navigate("/notifications");
    }
  };

  const canChat = user?.role === "customer" || user?.role === "provider";
  const chipTone = ROLE_CHIP[user?.role] || ROLE_CHIP.customer;

  return (
    <header className="flex items-center justify-between bg-ink px-6 py-[0.7rem] text-white">
      <Link
        className="text-2xl font-bold tracking-[-0.5px] text-white no-underline"
        to={isAuthenticated ? roleHome(user?.role) : "/login"}
      >
        Fix<span style={{ color: "#FF6A00" }}>It</span>
      </Link>

      {isAuthenticated && (
        <div className="flex items-center gap-4 relative">
          {canChat && (
            <Link
              className="border-b-2 border-transparent px-[0.2rem] py-[0.3rem] text-[0.92rem] font-semibold text-white no-underline hover:border-brand"
              to="/chat"
            >
              Messages
            </Link>
          )}

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 text-ink max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-orange-500 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.isRead ? "bg-orange-50" : ""
                      }`}
                    >
                      <p className="text-sm font-medium">{n.title || "Notification"}</p>
                      <p className="text-xs text-slate-600 truncate">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
                {notifications.length > 10 && (
                  <div className="p-2 text-center border-t border-slate-100">
                    <Link
                      to="/notifications"
                      className="text-xs text-orange-500 hover:underline"
                      onClick={() => setDropdownOpen(false)}
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <span className="flex items-center gap-2 text-[0.92rem]">
            {user?.name}
            <span
              className={`rounded-full px-2 py-[0.15rem] text-[0.7rem] uppercase tracking-[0.06em] ${chipTone}`}
            >
              {user?.role}
            </span>
          </span>
          <button
            className="cursor-pointer rounded-lg border border-white/40 bg-transparent px-[0.9rem] py-[0.45rem] font-semibold text-white transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}