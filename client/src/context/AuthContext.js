import React, { createContext, useEffect, useState } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token;

  const loadUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/user');
      setUser(res.data);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line
  }, [token]);

  const login = async (email, password, options = {}) => {
    // options can include { termsAccepted: boolean, remember: boolean }
    const payload = { email, password, ...options };
    const res = await api.post('/auth/login', payload);
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    }
    return res;
  };

  const register = async (payload) => {
    // If payload is FormData (with file), set proper headers
    let config = {};
    if (payload instanceof FormData) {
      config = { headers: { 'Content-Type': 'multipart/form-data' } };
    }
    const res = await api.post('/auth/register', payload, config);
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    }
  };

  const resendVerification = async (email) => {
    const res = await api.post('/auth/resend', { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, isAuthenticated, login, register, logout, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
};