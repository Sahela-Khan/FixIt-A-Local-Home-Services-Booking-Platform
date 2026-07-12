import { useState } from "react";
import { updateAvailability } from "../../services/providerService";

const OPTIONS = [
  { value: "online", label: "Online", dot: "bg-emerald-500" },
  { value: "busy", label: "Busy", dot: "bg-amber-500" },
  { value: "offline", label: "Offline", dot: "bg-slate-400" },
];

export default function AvailabilityToggle({ status, onChange }) {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (value) => {
    if (value === status || saving) return;
    setSaving(true);
    onChange(value); // optimistic
    await updateAvailability(value);
    setSaving(false);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSelect(opt.value)}
          disabled={saving}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition
            ${
              status === opt.value
                ? "bg-teal-800 text-white"
                : "text-slate-500 hover:bg-slate-100"
            } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}
