import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ao abrir o app, verifica se já tem token salvo
  useEffect(() => {
    async function loadUser() {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('Token encontrado:', token);
        if (token) {
          try {
            const response = await api.get('/users/me');
            setUser(response.data);
          } catch (e) {
            console.log('Erro ao buscar usuário:', e.message);
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (e) {
        console.log('Erro no AsyncStorage:', e.message);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    await AsyncStorage.setItem('token', access_token);
    const me = await api.get('/users/me');
    setUser(me.data);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
