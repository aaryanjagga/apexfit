import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('apexfit_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('apexfit_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('apexfit_admin_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/admin/me');
        if (res.data.success && res.data.admin) {
          setAdmin(res.data.admin);
          localStorage.setItem('apexfit_admin_user', JSON.stringify(res.data.admin));
        }
      } catch (err) {
        console.error('Failed to verify admin auth:', err.message);
        localStorage.removeItem('apexfit_admin_token');
        localStorage.removeItem('apexfit_admin_user');
        setAdmin(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    if (res.data.success) {
      const { token: receivedToken, admin: receivedAdmin } = res.data;
      setToken(receivedToken);
      setAdmin(receivedAdmin);
      localStorage.setItem('apexfit_admin_token', receivedToken);
      localStorage.setItem('apexfit_admin_user', JSON.stringify(receivedAdmin));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('apexfit_admin_token');
    localStorage.removeItem('apexfit_admin_user');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
