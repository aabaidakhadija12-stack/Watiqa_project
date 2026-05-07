import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { getAuthToken, setAuthToken as setApiAuthToken, clearSession } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = localStorage.getItem('watiqa_user');
        const cached = raw ? JSON.parse(raw) : null;
        const token = getAuthToken();

        if (cached && token) {
          setUser(cached);
        }

        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('watiqa_user', JSON.stringify(res.data));
        } else {
          setUser(null);
        }
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = (userData, token) => {
    if (token) setApiAuthToken(token);
    setUser(userData);
    localStorage.setItem('watiqa_user', JSON.stringify(userData));
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
