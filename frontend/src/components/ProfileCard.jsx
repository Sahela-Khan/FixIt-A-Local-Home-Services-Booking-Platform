import { useState } from "react";
import { User as UserIcon, MapPin, Phone, Mail, Pencil, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function ProfileCard() {
  const { user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    address: user?.address || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openCard = () => {
    setForm({ address: user?.address || "", phone: user?.phone || "", email: user?.email || "" });
    setEditing(false);
    setError("");
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.put("/auth/me", form);
      updateUser(res.data.user);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={openCard}
        className="w-full flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition"
      >
        <span className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <UserIcon size={18} className="text-white" />
        </span>
        <span className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-slate-900 text-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                  <UserIcon size={22} className="text-white" />
                </span>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.role}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-3">{error}</p>
            )}

            {!editing ? (
              <>
                <div className="space-y-2 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-500 shrink-0" />
                    {user?.address || "No address on file"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-500 shrink-0" />
                    {user?.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-500 shrink-0" />
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg"
                >
                  <Pencil size={14} /> Edit details
                </button>
              </>
            ) : (
              <form onSubmit={save} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 border border-slate-700 text-slate-300 text-sm font-semibold py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
