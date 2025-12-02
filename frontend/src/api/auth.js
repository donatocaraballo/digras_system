import api from "./api";

export async function login(username, password) {
  try {
    const response = await api.post("/login/", {
      username,
      password,
    });

    return response.data.token; // DRF devuelve {"token": "..."}
  } catch (error) {
    // Convertimos errores a formato controlado
    if (error.response?.status === 400) {
      throw new Error("Credenciales incorrectas");
    }

    throw new Error("Error al conectar con el servidor");
  }
}