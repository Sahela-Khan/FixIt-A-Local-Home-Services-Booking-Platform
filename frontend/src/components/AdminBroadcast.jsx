import { useState } from "react";
import api from "../api/axios";

export default function AdminBroadcast() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await api.post("/notifications/broadcast", { message });
      setSuccess(true);
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send broadcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">📢 Admin Broadcast</h3>
      <p className="text-sm text-slate-500 mb-4">
        Send an announcement to all users. They will receive an in-app notification and an email.
      </p>
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">
          Broadcast sent successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Announcement Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Type your announcement here..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Broadcast Now"}
        </button>
      </form>
    </div>
  );
}