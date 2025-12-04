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
                // 🚨 ESTA LÍNEA ES CRÍTICA: Configura el header globalmente
                axios.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
                setUser(JSON.parse(storedUser));
            }
            setLoading(false); // Solo después de esto, la app renderiza las rutas protegidas
        };
        checkLoggedIn();
    }, []);

    // 2. Función de Login
    const login = async (username, password) => {
        try {
            // URL correcta según el nuevo base/urls.py
            const response = await axios.post('http://127.0.0.1:8000/api/base/login/', { 
                username, 
                password 
            });

            // 🚨 CAMBIO CLAVE PARA TOKEN AUTH 🚨
            // Django Token Auth devuelve: { "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" }
            const { token } = response.data; 
            
            // Guardamos el token
            localStorage.setItem('auth_token', token);
            
            // Como TokenAuth no devuelve datos del usuario, creamos un objeto básico
            // o hacemos una petición extra a /api/base/usuarios/me/ si tuvieras ese endpoint.
            const userData = { username }; 
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Configurar Axios: IMPORTANTE usar "Token" en vez de "Bearer"
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
            
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
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);