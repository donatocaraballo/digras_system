import React, { useState } from "react";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);  // << usamos nuestro AuthContext
      window.location.href = "/";      // Redireccionar
    } catch (err) {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleLogin}>
        <input placeholder="Usuario" onChange={(e) => setUser(e.target.value)} />
        <input type="password" placeholder="Clave" onChange={(e) => setPass(e.target.value)} />
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}