import { useState, useEffect } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import api from "../api/axios";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/notifications")
      .then((res) => setNotifications(res.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        {!loading && notifications.length === 0 && (
          <p className="text-sm text-slate-400">You're all caught up — no notifications yet.</p>
        )}
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`border rounded-lg p-3 flex justify-between items-center ${
                n.isRead ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n._id)} title="Mark as read">
                  <CheckCircle2 size={18} className="text-slate-300 hover:text-green-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}