import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Store token
      localStorage.setItem('token', token);

      // Fetch user data
      const fetchUser = async () => {
        try {
          const { authAPI } = await import('../../utils/api');
          const response = await authAPI.getCurrentUser();
          
          if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            updateUser(response.data.user);
            navigate('/student-dashboard');
          } else {
            navigate('/login?error=oauth_failed');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          navigate('/login?error=oauth_failed');
        }
      };

      fetchUser();
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon name="GraduationCap" size={32} color="white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we set up your account</p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
