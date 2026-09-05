const TONE = {
  open: "bg-[#fdeed3] text-[#a06a04]",
  "under review": "bg-[#e4edf6] text-[#2b5d8a]",
  resolved: "bg-[#e4f6ea] text-[#1e6b45]",
  rejected: "bg-danger-bg text-danger-text",
};

export default function DisputeStatusBadge({ status }) {
  const tone = TONE[status] || "bg-[#eceae4] text-ink-soft";
  return (
    <span
      className={`inline-block rounded-full px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em] ${tone}`}
    >
      {status}
    </span>
  );
}
