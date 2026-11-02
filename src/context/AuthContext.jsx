import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI, UserAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartpark_token') || null);
  const [loading, setLoading] = useState(!!localStorage.getItem('smartpark_token'));
  const [authError, setAuthError] = useState(null);

  // Derive role from actual user object only
  const role = user?.role || 'guest';

  // On mount: if we have a stored token, validate it and restore real session
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('smartpark_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await UserAPI.getProfile();
        if (res.user) {
          setUser(res.user);
        } else {
          // Token exists but profile fetch returned no user — clear session
          localStorage.removeItem('smartpark_token');
          localStorage.removeItem('smartpark_role');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        // Token invalid or backend down — clear invalid session
        console.warn('[AuthContext] Session restore failed:', err.message);
        localStorage.removeItem('smartpark_token');
        localStorage.removeItem('smartpark_role');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []); // Only runs on initial mount

  const login = async (email, password) => {
    setAuthError(null);
    try {
      setLoading(true);
      const res = await AuthAPI.login({ email, password });
      if (res.token && res.user) {
        localStorage.setItem('smartpark_token', res.token);
        localStorage.setItem('smartpark_role', res.user.role);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      throw new Error('Unexpected response from server. Please try again.');
    } catch (err) {
      const msg = err.message || 'Invalid email or password credentials';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      setLoading(true);
      const res = await AuthAPI.register(userData);
      if (res.token && res.user) {
        localStorage.setItem('smartpark_token', res.token);
        localStorage.setItem('smartpark_role', res.user.role);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      throw new Error('Registration did not return a valid session. Please log in.');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (err) {
      // Ignore logout API errors — still clear local session
    }
    localStorage.removeItem('smartpark_token');
    localStorage.removeItem('smartpark_role');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        token,
        loading,
        authError,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
