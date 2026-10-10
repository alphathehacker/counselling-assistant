import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Check for OAuth errors
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'oauth_failed') {
      setErrors({ general: 'OAuth authentication failed. Please try again.' });
    }
  }, [searchParams]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Use admin-specific login endpoint
      const { authAPI } = await import('../../utils/api');
      const response = await authAPI.adminLogin({
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        const { token, admin } = response.data;

        // Store token and admin data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          ...admin,
          userType: 'admin', // For compatibility
        }));

        // Update auth context and navigate
        window.location.href = '/admin'; // Force reload to update auth context
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({
        general: error.response?.data?.message || 'Invalid admin credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/"
        className="w-full max-w-md mb-6 text-sm text-purple-600 hover:text-purple-700 inline-flex items-center font-medium bg-white/70 px-4 py-2 rounded-lg shadow-sm transition-all hover:bg-white self-center justify-start"
      >
        <Icon name="ArrowLeft" size={16} className="mr-2" />
        Back to home
      </Link>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="Shield" size={28} color="white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">Admin Portal</span>
          </Link>
        </div>

        {/* Admin Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Icon name="Shield" size={32} color="white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Admin Login
            </h1>
            <p className="text-gray-600 text-center">
              Sign in to access the admin panel
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <Input
              type="email"
              name="email"
              label="Admin Email"
              placeholder="admin@admissionpredictor.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
            />

            {/* Password Input */}
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[2.25rem] text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <Icon name="EyeOff" size={20} />
                ) : (
                  <Icon name="Eye" size={20} />
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign in as Admin'}
            </Button>
          </form>

          {/* Regular User Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Not an admin?
            </p>
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center"
            >
              <Icon name="ArrowRight" size={16} className="mr-1" />
              Go to regular login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <strong>Security Notice:</strong> This is a restricted area. Only authorized administrators should access this portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
