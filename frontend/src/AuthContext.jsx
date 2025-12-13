// frontend/src/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Crea el contexto
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Al cargar la app, verificar si ya hay sesión guardada
    useEffect(() => {
        const checkLoggedIn = async () => {
            const storedUser = localStorage.getItem('user_data');
            const storedToken = localStorage.getItem('auth_token');

            if (storedUser && storedToken) {
                // Configurar header globalmente
                axios.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
                
                // Parsear usuario (Aquí recuperamos el rol, nombre, etc. guardado)
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Error parseando usuario:", e);
                    localStorage.removeItem('user_data');
                }
            }
            setLoading(false); 
        };
        checkLoggedIn();
    }, []);

    // 2. Función de Login
    const login = async (username, password) => {
        try {
            // Petición al nuevo endpoint CustomLogin
            // Asegúrate que la URL coincida con tu urls.py (ej: /api/base/login/)
            const response = await axios.post('http://127.0.0.1:8000/api/base/login/', { 
                username, 
                password 
            });

            // 🚨 AHORA EL BACKEND DEVUELVE: { token: "...", user: { ...datos_completos } }
            const { token, user: userData } = response.data; 
            
            // Guardamos el token
            localStorage.setItem('auth_token', token);
            
            // 🚨 CRÍTICO: Guardamos el OBJETO COMPLETO del usuario (id, tipo, nombre, etc)
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Configurar Axios
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
            
            // Actualizar estado
            setUser(userData);
            return true;
            
        } catch (error) {
            console.error("Error Login:", error);
            throw error;
        }
    };

    // 3. Función de Logout
    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        // Opcional: Redirigir o recargar si es necesario
        window.location.href = '/login'; 
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);