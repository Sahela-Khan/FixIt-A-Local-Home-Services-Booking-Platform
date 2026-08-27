import { useAuth } from "../context/AuthContext";
import DisputeSubmit from "../components/disputes/DisputeSubmit";
import DisputeAgainstMe from "../components/disputes/DisputeAgainstMe";

export default function Disputes() {
  const { user } = useAuth();
  const isProvider = user?.role === "provider";

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10">
      <h2 className="mb-1 text-2xl font-bold">
        {isProvider ? "Complaints about my services" : "Help and complaints"}
      </h2>
      <p className="mb-7 mt-0 text-[0.95rem] text-ink-soft">
        {isProvider
          ? "Complaints customers have raised about your work, and how they were resolved."
          : "Report a problem with a booking and track what the administrators decide."}
      </p>
      {isProvider ? <DisputeAgainstMe /> : <DisputeSubmit />}
    </div>
  );
}
