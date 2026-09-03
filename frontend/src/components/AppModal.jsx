import { X } from "lucide-react";

// A small in-app popup used instead of the browser's native alert()/prompt()/confirm()
// ("localhost says..." boxes). Two modes:
//   type="message" -> just shows text + an OK button
//   type="confirm" -> shows text + optional reason textarea + Cancel/Confirm buttons
export default function AppModal({
  open,
  title,
  message,
  type = "message", // "message" | "confirm"
  showReasonInput = false,
  reason,
  onReasonChange,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
  confirming = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
        <h3 className="font-bold text-lg mb-2 pr-6">{title}</h3>
        <p className="text-sm text-slate-600 mb-3">{message}</p>

        {showReasonInput && (
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            rows={2}
          />
        )}

        {type === "message" ? (
          <button
            onClick={onClose}
            className="w-full bg-slate-800 text-white font-semibold py-2 rounded-lg"
          >
            OK
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg disabled:opacity-60"
            >
              {confirming ? "Please wait..." : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}