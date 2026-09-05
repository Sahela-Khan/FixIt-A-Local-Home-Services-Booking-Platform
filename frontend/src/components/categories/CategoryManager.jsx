import { useEffect, useState } from "react";
import api from "../../api/axios";

const FIELD =
  "w-full rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.55rem] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";
const LABEL = "mb-[0.3rem] block text-[0.85rem] font-semibold";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const OKALERT =
  "mt-4 rounded-[7px] border border-[#b8dfc9] bg-[#eaf7f0] px-[0.8rem] py-[0.6rem] text-[0.9rem] text-[#1e6b45]";
const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const TABLE =
  "w-full border-collapse overflow-hidden rounded-lg border border-line bg-surface text-[0.92rem] max-[700px]:block max-[700px]:overflow-x-auto";
const TH = "bg-ink px-[0.9rem] py-[0.65rem] text-left font-semibold text-white";
const TD = "border-t border-line px-[0.9rem] py-[0.65rem] align-middle";
const BTN =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";
const BTN_DARK = `${BTN} bg-ink text-white hover:bg-[#33434f]`;
const BTN_OUTLINE = `${BTN} border border-line bg-transparent text-ink hover:border-ink`;
const BTN_DANGER = `${BTN} bg-[#c0392b] text-white hover:bg-[#a03024]`;
const BADGE =
  "inline-block rounded-full px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em]";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [unregistered, setUnregistered] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [reassignTo, setReassignTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.categories);
      setUnregistered(res.data.unregistered);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api.post("/categories", form);
      setNotice(`Category ${res.data.category.name} added.`);
      setForm({ name: "", description: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add the category.");
    } finally {
      setBusy(false);
    }
  };

  const importExisting = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api.post("/categories/import");
      setNotice(
        res.data.created > 0
          ? `Registered ${res.data.created} category name(s) already used by services.`
          : "Nothing to import."
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import categories.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api.put(`/categories/${editing._id}`, {
        name: editing.name,
        description: editing.description,
      });
      const moved = res.data.renamedServices;
      setNotice(
        moved > 0
          ? `Renamed to ${res.data.category.name}. ${moved} service(s) updated.`
          : `Category ${res.data.category.name} saved.`
      );
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save the category.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (cat) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update the category.");
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body = reassignTo ? { reassignTo } : {};
      const res = await api.delete(`/categories/${removing._id}`, { data: body });
      setNotice(
        res.data.movedServices > 0
          ? `${res.data.message} ${res.data.movedServices} service(s) moved.`
          : res.data.message
      );
      setRemoving(null);
      setReassignTo("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove the category.");
    } finally {
      setBusy(false);
    }
  };

  const others = categories.filter((c) => c._id !== removing?._id);

  return (
    <>
      <form className="rounded-lg border border-line bg-surface p-6" onSubmit={create}>
        <h3 className="m-0 mb-1 text-[1.17rem] font-bold">Add a service category</h3>
        <p className={MUTED}>
          Categories decide how providers list services and how customers browse them.
        </p>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div>
            <label className={LABEL} htmlFor="name">Category name</label>
            <input
              className={FIELD}
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Carpentry"
              maxLength={40}
              required
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="description">Description</label>
            <input
              className={FIELD}
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Furniture repair and fitting"
              maxLength={200}
            />
          </div>
        </div>

        {error && <div className={ALERT}>{error}</div>}
        {notice && <div className={OKALERT}>{notice}</div>}

        <div className="mt-5 flex justify-end">
          <button className={BTN_DARK} type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add category"}
          </button>
        </div>
      </form>

      {unregistered.length > 0 && (
        <div className="mt-6 rounded-lg border border-line border-l-4 border-l-brand bg-surface px-[1.3rem] py-[1.1rem]">
          <h3 className="m-0 mb-1 text-[1.05rem] font-bold">
            {unregistered.length} category name(s) are in use but not registered
          </h3>
          <p className={MUTED}>
            Providers already created services under these names. Register them so they can
            be renamed and managed properly.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unregistered.map((u) => (
              <span
                key={u.name}
                className="rounded-full border border-line bg-[#fbfaf7] px-[0.7rem] py-[0.25rem] text-[0.85rem]"
              >
                {u.name} ({u.serviceCount})
              </span>
            ))}
          </div>
          <div className="mt-4">
            <button className={BTN_DARK} onClick={importExisting} disabled={busy}>
              Register all
            </button>
          </div>
        </div>
      )}

      <h3 className="mb-3 mt-8 text-[1.1rem] font-bold">All categories</h3>

      {loading ? (
        <p className={MUTED}>Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className={MUTED}>No categories yet. Add one using the form above.</p>
      ) : (
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Name</th>
              <th className={TH}>Description</th>
              <th className={TH}>Services</th>
              <th className={TH}>Status</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr className="even:bg-[#fbfaf7]" key={c._id}>
                <td className={TD}>
                  <span className="font-bold">{c.name}</span>
                </td>
                <td className={TD}>
                  <span className="text-[0.85rem] text-ink-soft">
                    {c.description || "No description"}
                  </span>
                </td>
                <td className={TD}>{c.serviceCount}</td>
                <td className={TD}>
                  <span
                    className={`${BADGE} ${
                      c.isActive
                        ? "bg-[#e4f6ea] text-[#1e6b45]"
                        : "bg-[#eceae4] text-ink-soft"
                    }`}
                  >
                    {c.isActive ? "active" : "hidden"}
                  </span>
                </td>
                <td className={TD}>
                  <div className="flex flex-wrap gap-[0.4rem]">
                    <button
                      className={BTN_OUTLINE}
                      disabled={busy}
                      onClick={() => setEditing({ ...c })}
                    >
                      Edit
                    </button>
                    <button
                      className={BTN_OUTLINE}
                      disabled={busy}
                      onClick={() => toggleActive(c)}
                    >
                      {c.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                      className={BTN_DANGER}
                      disabled={busy}
                      onClick={() => {
                        setRemoving(c);
                        setReassignTo("");
                        setError("");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
          onClick={() => setEditing(null)}
        >
          <form
            className="w-full max-w-[440px] rounded-lg bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEdit}
          >
            <h3 className="m-0 mb-2 text-[1.17rem] font-bold">Edit category</h3>
            <p className={MUTED}>
              Renaming updates every service currently using this category.
            </p>

            <label className={`${LABEL} mt-4`} htmlFor="edit-name">Name</label>
            <input
              className={FIELD}
              id="edit-name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              maxLength={40}
              required
            />

            <label className={`${LABEL} mt-4`} htmlFor="edit-desc">Description</label>
            <input
              className={FIELD}
              id="edit-desc"
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              maxLength={200}
            />

            {editing.serviceCount > 0 && (
              <p className="mb-0 mt-3 text-[0.85rem] text-ink-soft">
                {editing.serviceCount} service(s) will be updated if you change the name.
              </p>
            )}

            {error && <div className={ALERT}>{error}</div>}

            <div className="mt-5 flex justify-end gap-[0.6rem]">
              <button
                type="button"
                className={BTN_OUTLINE}
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className={BTN_DARK} disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {removing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
          onClick={() => setRemoving(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-lg bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-2 text-[1.17rem] font-bold">
              Remove {removing.name}
            </h3>

            {removing.serviceCount > 0 ? (
              <>
                <p className={MUTED}>
                  {removing.serviceCount} service(s) still use this category. Choose where
                  to move them.
                </p>
                <label className={`${LABEL} mt-4`} htmlFor="reassign">Move services to</label>
                <select
                  className={FIELD}
                  id="reassign"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                >
                  <option value="">Choose a category</option>
                  {others.map((o) => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </select>
              </>
            ) : (
              <p className={MUTED}>
                No services use this category, so it can be removed safely.
              </p>
            )}

            {error && <div className={ALERT}>{error}</div>}

            <div className="mt-5 flex justify-end gap-[0.6rem]">
              <button
                className={BTN_OUTLINE}
                onClick={() => setRemoving(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className={BTN_DANGER}
                onClick={confirmRemove}
                disabled={busy || (removing.serviceCount > 0 && !reassignTo)}
              >
                {busy ? "Removing…" : "Remove category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
