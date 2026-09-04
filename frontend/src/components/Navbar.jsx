import { Link, useNavigate } from "react-router-dom";
import { useAuth, roleHome } from "../context/AuthContext";

const ROLE_CHIP = {
  provider: "bg-brand text-ink",
  admin: "bg-white text-ink",
  customer: "bg-white/15",
};

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canChat = user?.role === "customer" || user?.role === "provider";
  const chipTone = ROLE_CHIP[user?.role] || ROLE_CHIP.customer;

  return (
    <header className="flex items-center justify-between bg-ink px-6 py-[0.7rem] text-white">
      <Link
        className="text-2xl font-bold tracking-[-0.5px] text-white no-underline"
        to={isAuthenticated ? roleHome(user?.role) : "/login"}
      >
        Fix<span className="text-orange-500">It</span>
      </Link>

      {isAuthenticated && (
        <div className="flex items-center gap-4">
          {canChat && (
            <Link
              className="border-b-2 border-transparent px-[0.2rem] py-[0.3rem] text-[0.92rem] font-semibold text-white no-underline hover:border-brand"
              to="/chat"
            >
              Messages
            </Link>
          )}
          <span className="flex items-center gap-2 text-[0.92rem]">
            {user?.name}
            <span
              className={`rounded-full px-2 py-[0.15rem] text-[0.7rem] uppercase tracking-[0.06em] ${chipTone}`}
            >
              {user?.role}
            </span>
          </span>
          <button
            className="cursor-pointer rounded-lg border border-white/40 bg-transparent px-[0.9rem] py-[0.45rem] font-semibold text-white transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
