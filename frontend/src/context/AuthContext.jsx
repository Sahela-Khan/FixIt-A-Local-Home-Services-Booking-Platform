import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const roleHome = (role) => {
  if (role === "provider") return "/provider/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/dashboard";
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("fixit_user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("fixit_token"));
  const [user, setUser] = useState(readStoredUser);

  const login = (newToken, newUser) => {
    localStorage.setItem("fixit_token", newToken);
    localStorage.setItem("fixit_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("fixit_token");
    localStorage.removeItem("fixit_user");
    setToken(null);
    setUser(null);
  };

  const value = { token, user, isAuthenticated: Boolean(token), login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
