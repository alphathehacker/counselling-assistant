import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Utility function to validate MongoDB ObjectId format
export const isValidObjectId = (id) => {
  if (!id) return false;
  const idStr = String(id);
  return /^[0-9a-fA-F]{24}$/.test(idStr);
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasToken = !!localStorage.getItem('token');
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Suppress expected errors for unauthenticated users
    const isAuthRoute = url.includes('/auth/me') ||
      url.includes('/auth/admin/me') ||
      url.includes('/user/bookmarks');

    // Suppress 404/401 errors for auth routes when user has no token (expected behavior)
    const shouldSuppressError = (status === 401 || status === 404) &&
      isAuthRoute &&
      !hasToken;

    // Only log unexpected errors or errors when user should be authenticated
    if (!shouldSuppressError) {
      // Don't log 404s for auth routes even if user has token (might be endpoint not found)
      if (status === 404 && isAuthRoute && hasToken) {
        // Silently handle - might be backend not running or endpoint missing
      } else if (error.response) {
        // Server responded with error status
        console.error('API Error Response:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request made but no response (network error)
        console.error('API Network Error:', error.request);
      } else {
        // Error in request setup
        console.error('API Error:', error.message);
      }
    }

    if (status === 401 && hasToken) {
      // Only redirect if we had a token (user was logged in but token expired)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Prevent infinite redirect loop
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && !currentPath.startsWith('/auth/callback')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Cache keys
const CACHE_KEYS = {
  BOOKMARKS: 'session_cache_bookmarks_v2',
  COLLEGES: 'session_cache_colleges_v2_'
};

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  // Silent version that doesn't log errors (for optional auth checks)
  getCurrentUserSilent: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(new Error('No token'));
    }
    try {
      return await api.get('/auth/me');
    } catch (error) {
      // Silently reject - caller should handle
      return Promise.reject(error);
    }
  },
  // Admin auth
  adminLogin: (data) => api.post('/auth/admin/login', data),
  getCurrentAdmin: () => api.get('/auth/admin/me'),
  // Stats
  incrementReportsDownloaded: () => api.post('/auth/stats/reports-downloaded'),
  // Bookmarks
  getBookmarks: async () => {
    // Try to serve from session cache first
    const cached = sessionStorage.getItem(CACHE_KEYS.BOOKMARKS);
    if (cached) {
      return { data: JSON.parse(cached), fromCache: true };
    }
    const response = await api.get('/user/bookmarks');
    if (response.data.success) {
      sessionStorage.setItem(CACHE_KEYS.BOOKMARKS, JSON.stringify(response.data));
    }
    return response;
  },
  addBookmark: (data) => {
    sessionStorage.removeItem(CACHE_KEYS.BOOKMARKS); // clear cache
    return api.post('/user/bookmarks', data);
  },
  removeBookmark: (bookmark) => {
    if (!bookmark) {
      return Promise.reject(new Error('Bookmark object is required'));
    }
    const collegeId = bookmark.collegeId || bookmark._id || bookmark.id || bookmark.bookmarkId;
    if (!collegeId) {
      return Promise.reject(new Error('College ID is required'));
    }
    sessionStorage.removeItem(CACHE_KEYS.BOOKMARKS); // clear cache
    return api.delete(`/user/bookmarks/${collegeId}`);
  },
  updateBookmark: (bookmarkId, data) => {
    sessionStorage.removeItem(CACHE_KEYS.BOOKMARKS); // clear cache
    return api.put(`/user/bookmarks/${bookmarkId}`, data);
  },
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Prediction API calls
export const predictionAPI = {
  predict: (data) => api.post('/prediction/predict', data),
  predict2: (data) => api.post('/prediction2/predict', data),

  getBranches: (examType, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.locations && Array.isArray(params.locations)) {
      params.locations.forEach(loc => queryParams.append('locations', loc));
    }
    const queryString = queryParams.toString();
    return api.get(`/prediction/branches/${examType}${queryString ? `?${queryString}` : ''}`);
  },
  getLocations: (examType) => api.get(`/prediction/locations/${examType}`),
  getCategories: (examType) => api.get(`/prediction/categories/${examType}`),
  getCollegeById: (id) => api.get(`/prediction/colleges/${id}`),
  getCollegesByNames: (collegeNames) => api.post('/prediction/colleges/details', { collegeNames }),
  // User-specific prediction results
  getResults: (params) => api.get('/prediction/results', { params }),
  getResultById: (id) => api.get(`/prediction/results/${id}`),
  deleteResult: (id) => api.delete(`/prediction/results/${id}`),
  sendEmail: (data) => api.post('/prediction/results/send-email', data),
  post: (url, data) => api.post(`/prediction${url}`, data),
};

// Colleges API calls (public endpoint for students)
export const collegesAPI = {
  getAll: async (params) => {
    const cacheKey = CACHE_KEYS.COLLEGES + JSON.stringify(params || {});
    // DISABLE CACHE TEMPORARILY: Bypassing browser-corrupted "0 results" storage
    // const cached = sessionStorage.getItem(cacheKey);
    // if (cached) {
    //   return { data: JSON.parse(cached), fromCache: true };
    // }
    console.log('[DEBUG] Fetching backend colleges with params:', params);
    try {
      const response = await api.get('/prediction/colleges', { params });
      console.log(`[DEBUG] Received ${response?.data?.colleges?.length} colleges from backend`);
      return response;
    } catch (e) {
      console.error('[DEBUG] collegesAPI.getAll threw an error:', e);
      throw e;
    }
  },
  getById: (id) => api.get(`/prediction/colleges/${id}`),
};

// Image API calls
export const imageAPI = {
  search: (data) => api.post('/images/search', data),
};

// Notification API calls
export const notificationAPI = {
  getAiNotifications: () => api.get('/notifications/ai'),
};
