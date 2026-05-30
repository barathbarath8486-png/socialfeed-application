import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api";

const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading until auth check done

  // On mount: check if a token exists and fetch the user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token invalid or expired — clear it
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Called after successful login/signup
  const loginUser = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  // Called on logout
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
