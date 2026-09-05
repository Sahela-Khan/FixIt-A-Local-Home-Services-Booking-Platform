import { Clock3 } from "lucide-react";

// Reusable placeholder shown in place of a flagged-off feature's UI.
// See src/config/featureFlags.js.
export default function ComingSoon({ title, description, compact = false }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        <Clock3 size={12} /> Coming in Sprint 3
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <Clock3 size={22} className="text-slate-400" />
      <p className="font-semibold text-slate-600">{title || "Coming in Sprint 3"}</p>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
    </div>
  );
}
