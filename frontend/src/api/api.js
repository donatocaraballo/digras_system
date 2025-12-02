// frontend/src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// 👉 Adjuntar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;