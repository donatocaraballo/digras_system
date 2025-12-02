// frontend/src/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";
import api from "./api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = async (username, password) => {
    const response = await api.post("/api-token-auth/", {
      username,
      password,
    });

    const newToken = response.data.token;

    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}