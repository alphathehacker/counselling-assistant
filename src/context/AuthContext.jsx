import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      // Safety timeout to ensure loading doesn't hang
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Verify token by fetching current user/admin
          if (userData.userType === 'admin') {
            // Try admin endpoint first
            try {
              const response = await authAPI.getCurrentAdmin();
              if (response.data.success) {
                setUser({ ...response.data.admin, userType: 'admin' });
                localStorage.setItem('user', JSON.stringify({ ...response.data.admin, userType: 'admin' }));
              }
            } catch (error) {
              // Fallback to regular user endpoint
              try {
                const response = await authAPI.getCurrentUser();
                if (response.data.success) {
                  setUser(response.data.user);
                  localStorage.setItem('user', JSON.stringify(response.data.user));
                }
              } catch (err) {
                // If both fail, logout
                logout();
              }
            }
          } else {
            // Regular user
            const response = await authAPI.getCurrentUser();
            if (response.data.success) {
              setUser(response.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
          }
        } catch (error) {
          console.error('Error loading user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      return {
        success: false,
        message: response.data.message || 'Registration failed',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed. Please check your connection.',
        errors: error.response?.data?.errors,
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  };

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.userType === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
