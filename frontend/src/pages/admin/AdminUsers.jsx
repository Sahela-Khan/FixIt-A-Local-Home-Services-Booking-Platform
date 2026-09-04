import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const FIELD =
  "rounded-[7px] border border-slate-200 bg-white px-[0.8rem] py-[0.55rem] text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-[3px] focus:ring-orange-500/20";
const MODAL_FIELD =
  "w-full rounded-[7px] border border-slate-200 bg-white px-[0.8rem] py-[0.6rem] text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-[3px] focus:ring-orange-500/20 disabled:bg-[#f1efe9] disabled:text-slate-500";
const MODAL_LABEL = "mb-[0.3rem] mt-[0.9rem] block text-[0.85rem] font-semibold";
const ALERT =
  "mt-4 rounded-[7px] border border-red-200 bg-red-50 px-[0.8rem] py-[0.6rem] text-[0.9rem] text-red-600";
const MUTED = "mt-0 text-[0.95rem] text-slate-500";
const TABLE =
  "w-full border-collapse overflow-hidden rounded-lg border border-slate-200 bg-white text-[0.92rem] max-[700px]:block max-[700px]:overflow-x-auto";
const TH = "bg-ink px-[0.9rem] py-[0.65rem] text-left font-semibold text-white";
const TD = "border-t border-slate-200 px-[0.9rem] py-[0.65rem] align-middle";
const BADGE =
  "ml-[0.45rem] inline-block rounded-full px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em]";
const BADGE_TONE = {
  customer: "bg-[#e4edf6] text-[#2b5d8a]",
  provider: "bg-[#fdeed3] text-[#a06a04]",
  admin: "bg-ink text-white",
};
const BTN_SMALL =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange-500 motion-reduce:transition-none";
const BTN_DARK = `${BTN_SMALL} bg-ink text-white hover:bg-[#33434f] disabled:cursor-wait disabled:opacity-60`;
const BTN_OUTLINE = `${BTN_SMALL} border border-slate-200 bg-transparent text-slate-800 hover:border-ink disabled:cursor-default disabled:opacity-45 disabled:hover:border-slate-200`;
const BTN_DANGER = `${BTN_SMALL} bg-[#c0392b] text-white hover:bg-[#a03024] disabled:cursor-wait disabled:opacity-60`;

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState({ search: "", role: "", page: 1 });
  const [data, setData] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    api
      .get("/admin/users", { params: query })
      .then((res) => {
        if (!ignore) setData(res.data);
      })
      .catch((err) => {
        if (!ignore)
          setError(err.response?.data?.message || "Failed to load users.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [query]);

  const refresh = () => setQuery((q) => ({ ...q }));

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery((q) => ({ ...q, search: searchInput.trim(), page: 1 }));
  };

  const openEdit = (u) => {
    setEditError("");
    setEditing({ id: u._id, name: u.name, phone: u.phone, role: u.role });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      await api.put(`/admin/users/${editing.id}`, {
        name: editing.name,
        phone: editing.phone,
        role: editing.role,
      });
      setEditing(null);
      refresh();
    } catch (err) {
      setEditError(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}'s account permanently?`)) return;
    setError("");
    try {
      await api.delete(`/admin/users/${u._id}`);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <>
      <form className="mb-5 flex flex-wrap gap-[0.6rem]" onSubmit={handleSearch}>
        <input
          className={`${FIELD} min-w-[200px] flex-1`}
          type="text"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className={FIELD}
          value={query.role}
          onChange={(e) =>
            setQuery((q) => ({ ...q, role: e.target.value, page: 1 }))
          }
        >
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="provider">Providers</option>
          <option value="admin">Admins</option>
        </select>
        <button className={BTN_DARK} type="submit">
          Search
        </button>
      </form>

      {error && <div className={ALERT}>{error}</div>}
      {loading ? (
        <p className={MUTED}>Loading users…</p>
      ) : (
        <>
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Email</th>
                <th className={TH}>Phone</th>
                <th className={TH}>Role</th>
                <th className={TH}>Joined</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr className="even:bg-[#fbfaf7]" key={u._id}>
                  <td className={TD}>
                    {u.name}
                    {u._id === me?.id && (
                      <span className="ml-[0.45rem] rounded-full bg-orange-500 px-[0.45rem] py-[0.1rem] text-[0.68rem] font-bold uppercase text-slate-800">
                        you
                      </span>
                    )}
                  </td>
                  <td className={TD}>{u.email}</td>
                  <td className={TD}>{u.phone}</td>
                  <td className={TD}>
                    <span className={`${BADGE} ${BADGE_TONE[u.role] || ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className={TD}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className={TD}>
                    <div className="flex gap-[0.4rem]">
                      {(u.role !== "admin" || u._id === me?.id) && (
                        <button
                          className={BTN_OUTLINE}
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          className={BTN_DANGER}
                          onClick={() => removeUser(u)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.users.length === 0 && (
            <p className={MUTED}>No users match this search.</p>
          )}

          <div className="mt-5 flex items-center gap-4">
            <button
              className={BTN_OUTLINE}
              disabled={data.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              Previous
            </button>
            <span className={MUTED}>
              Page {data.page} of {data.pages} ({data.total} users)
            </span>
            <button
              className={BTN_OUTLINE}
              disabled={data.page >= data.pages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              Next
            </button>
          </div>
        </>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
          onClick={() => setEditing(null)}
        >
          <form
            className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEdit}
          >
            <h3 className="m-0 mb-2 text-[1.17rem] font-bold">Edit user</h3>
            {editError && <div className={ALERT}>{editError}</div>}

            <label className={MODAL_LABEL} htmlFor="edit-name">Name</label>
            <input
              className={MODAL_FIELD}
              id="edit-name"
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              required
            />

            <label className={MODAL_LABEL} htmlFor="edit-phone">Phone</label>
            <input
              className={MODAL_FIELD}
              id="edit-phone"
              type="tel"
              value={editing.phone}
              onChange={(e) =>
                setEditing({ ...editing, phone: e.target.value })
              }
              required
            />

            <label className={MODAL_LABEL} htmlFor="edit-role">Role</label>
            <select
              className={MODAL_FIELD}
              id="edit-role"
              value={editing.role}
              disabled={editing.id === me?.id}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
            {editing.id === me?.id && (
              <p className="mb-0 mt-[0.4rem] text-[0.8rem] text-slate-500">
                You cannot change your own role.
              </p>
            )}

            <div className="mt-[1.4rem] flex justify-end gap-[0.6rem]">
              <button
                type="button"
                className={BTN_OUTLINE}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button type="submit" className={BTN_DARK} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
