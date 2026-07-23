import { Link, useNavigate } from "react-router-dom";
import { useAuth, roleHome } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canChat = user?.role === "customer" || user?.role === "provider";

  return (
    <header className="navbar">
      <Link className="brand" to={isAuthenticated ? roleHome(user?.role) : "/login"}>
        Fix<span>It</span>
      </Link>

      {isAuthenticated && (
        <div className="nav-right">
          {canChat && (
            <Link className="nav-link" to="/chat">
              Messages
            </Link>
          )}
          <span className="nav-user">
            {user?.name}
            <span className={`role-chip role-${user?.role}`}>{user?.role}</span>
          </span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
