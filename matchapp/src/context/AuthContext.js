"use client"; // Obligatorio en Next.js para Client Components

import React, { createContext, useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Efecto de carga inicial 
  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const token = localStorage.getItem('userToken');
        const user = localStorage.getItem('userInfo');
        
        if (token && user) {
          setUserToken(token);
          setUserInfo(JSON.parse(user));
        }
      } catch (error) {
        console.error("Error leyendo localStorage:", error);
      } finally {
        // Apagamos la pantalla de carga solo DESPUÉS de revisar el localStorage
        setIsLoading(false); 
      }
    };

    checkLoginStatus();
  }, []); // El array vacío asegura que esto solo pase UNA vez al cargar la página

  // 2. FUNCIÓN DE LOGIN
  const login = async (email, password) => {
    console.log(`🟡 [FRONTEND] Intentando enviar petición POST a: /auth/login`); // RADAR 1
    console.log(`🟡 [FRONTEND] Base URL configurada es:`, axios.defaults.baseURL); // RADAR 2 (Crucial para ver si lee el .env)

    try {
      const response = await axios.post('/auth/login', { email, password });

      console.log(`🟢 [FRONTEND] Respuesta exitosa recibida del servidor:`, response.data);

      const { token, user } = response.data;
      
      setUserToken(token);
      setUserInfo(user);
      
      localStorage.setItem('userToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
    } catch (error) {

        console.error(`🔴 [FRONTEND] La petición de login falló. Detalles:`, error);

      if (error.code === 'ERR_NETWORK') {
        console.error(`🔴 [FRONTEND] ¡ERROR DE RED! CORS bloqueó la petición o la URL del backend está mal escrita.`);
        throw 'No se pudo conectar con el servidor (Error de Red).';
      }

      // Si el backend respondió con un mensaje de error (Ej: 400 Bad Request)
      if (error.response) {
        console.error(`🔴 [FRONTEND] El backend rechazó el login con estado: ${error.response.status}`);
        throw error.response.data.error || 'Error al iniciar sesión';
      }

      throw error.response?.data?.error || 'Error al iniciar sesión';
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      const { token, user } = response.data;
      
      // Auto-loguear al usuario tras registrarse con éxito
      setUserToken(token);
      setUserInfo(user);
      
      localStorage.setItem('userToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
    } catch (error) {
      throw error.response?.data?.error || 'Error al registrarse';
    }
  };

  // 3. FUNCIÓN DE LOGOUT
  const logout = () => {
    setUserToken(null);
    setUserInfo(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ login, register, logout, userToken, userInfo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};