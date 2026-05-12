import { createContext, useContext, useState } from "react";
import logger from "../utils/logger";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userJson = localStorage.getItem("user");
      return userJson && userJson !== "undefined" ? JSON.parse(userJson) : null;
    } catch (error) {
      logger.error("Error parsing user from localStorage:", error);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const login = (data) => {
    const accessToken = data.accessToken || data.token;
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setToken(accessToken);
  };

  const logout = () => {
    // Notify listeners (CartContext) to persist/sync cart before clearing token
    try {
      window.dispatchEvent(new CustomEvent('app:logout'));
    } catch (err) {
      console.warn('Error dispatching logout event', err);
    }

    // Now clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
