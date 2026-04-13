import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/student-dashboard');
    }
  }, [isAuthenticated, navigate]);

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

    const result = await login(formData.email, formData.password);

    setIsLoading(false);

    if (result.success) {
      navigate('/student-dashboard');
    } else {
      setErrors({ general: result.message || 'Invalid email or password' });
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_URL}/auth/facebook`;
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/"
        className="absolute top-6 left-6 text-sm text-blue-600 hover:text-blue-700 inline-flex items-center font-medium bg-white/50 px-4 py-2 rounded-lg backdrop-blur-sm transition-all hover:bg-white/80"
      >
        <Icon name="ArrowLeft" size={16} className="mr-2" />
        Back to home
      </Link>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="GraduationCap" size={28} color="white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">Counselling Assistant</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">
              Sign in to continue to your dashboard
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
              label="Email address"
              placeholder="you@example.com"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center col-span-2 w-full"
              onClick={handleGoogleLogin}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google logo" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center col-span-2"
              onClick={() => document.querySelector('input[type="email"]').focus()}
            >
              <Icon name="Mail" size={20} className="mr-2" />
              Continue with Email
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Admin Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Are you an administrator?
            </p>
            <Link
              to="/admin/login"
              className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center"
            >
              <Icon name="Shield" size={16} className="mr-1" />
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;