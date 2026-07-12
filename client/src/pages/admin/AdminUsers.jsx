import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

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
      <form className="toolbar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
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
        <button className="btn btn-small btn-dark" type="submit">
          Search
        </button>
      </form>

      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading users…</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.name}
                    {u._id === me?.id && <span className="you-tag">you</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      {(u.role !== "admin" || u._id === me?.id) && (
                        <button
                          className="btn btn-small btn-outline"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          className="btn btn-small btn-danger"
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
            <p className="muted">No users match this search.</p>
          )}

          <div className="pagination">
            <button
              className="btn btn-small btn-outline"
              disabled={data.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              Previous
            </button>
            <span className="muted">
              Page {data.page} of {data.pages} ({data.total} users)
            </span>
            <button
              className="btn btn-small btn-outline"
              disabled={data.page >= data.pages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              Next
            </button>
          </div>
        </>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEdit}
          >
            <h3>Edit user</h3>
            {editError && <div className="alert">{editError}</div>}

            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              required
            />

            <label htmlFor="edit-phone">Phone</label>
            <input
              id="edit-phone"
              type="tel"
              value={editing.phone}
              onChange={(e) =>
                setEditing({ ...editing, phone: e.target.value })
              }
              required
            />

            <label htmlFor="edit-role">Role</label>
            <select
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
              <p className="muted small">You cannot change your own role.</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-small btn-outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-small btn-dark"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
