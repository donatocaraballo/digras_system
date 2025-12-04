// frontend/src/api/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:3000/api", // Asegúrate que este puerto es correcto
});

// 🚨 INTERCEPTOR MÁGICO 🚨
// Antes de que salga cualquier petición, inyecta el token.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;