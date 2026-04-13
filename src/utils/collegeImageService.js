/**
 * College Image Service
 * Fetches college images from MongoDB database only
 */

import api, { imageAPI } from './api';

// Cache for college images to avoid repeated searches
const imageCache = new Map();
// Cache for pending requests to avoid duplicate API calls
const pendingRequests = new Map();
// Rate limiting to prevent API overload
let requestCount = 0;
let lastRequestTime = 0;
const MAX_REQUESTS_PER_SECOND = 10;
const RETRY_DELAY = 1000; // 1 second

// Circuit breaker to prevent cascading failures
let consecutiveFailures = 0;
let circuitBreakerOpen = false;
let circuitBreakerOpenTime = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

/**
 * Generate a search query for college image
 */
const generateImageSearchQuery = (collegeName, location) => {
  // Keep full college name for better search results
  let cleanName = collegeName.trim();
  
  // Combine with location for better results
  const locationPart = location ? location.split(',')[0].trim() : '';
  const query = locationPart ? `${cleanName} ${locationPart} campus building` : `${cleanName} campus building`;
  
  return query;
};

/**
 * Search for actual college image using backend API
 * The backend will search for real college photos from MongoDB
 */
const searchCollegeImage = async (collegeName, location, collegeId = null, retryCount = 0) => {
  // Circuit breaker check
  if (circuitBreakerOpen) {
    const now = Date.now();
    if (now - circuitBreakerOpenTime > CIRCUIT_BREAKER_TIMEOUT) {
      // Try to close circuit breaker
      circuitBreakerOpen = false;
      consecutiveFailures = 0;
    } else {
      // Circuit breaker is still open, return default image
      return null;
    }
  }

  // Rate limiting check
  const now = Date.now();
  if (now - lastRequestTime < 1000) {
    requestCount++;
    if (requestCount > MAX_REQUESTS_PER_SECOND) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return searchCollegeImage(collegeName, location, collegeId, retryCount + 1);
    }
  } else {
    requestCount = 1;
    lastRequestTime = now;
  }

  try {
    // Reduce console logging - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetching image from MongoDB for: ${collegeName}${collegeId ? ` (ID: ${collegeId})` : ''}`);
    }
    
    const response = await imageAPI.search({
      collegeName: collegeName,
      location: location,
      collegeId: collegeId, // Pass collegeId to help backend find college in MongoDB
      // Allow backend to fall back to SerpAPI / other providers on first load.
      // Backend will still check MongoDB first and then cache any external image.
    });
    
    // Reset failure count on success
    consecutiveFailures = 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('MongoDB API response:', response.data);
    }
    
    if (response.data && response.data.success && response.data.imageUrl) {
      const imageUrl = response.data.imageUrl;
      // Validate that imageUrl is a valid string
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '' && 
          imageUrl !== 'undefined' && imageUrl !== 'null') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Got image URL from MongoDB: ${imageUrl}${response.data.cached ? ' (cached)' : ' (fresh)'}`);
        }
        return imageUrl;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('MongoDB returned invalid image URL:', imageUrl);
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('MongoDB returned no image URL, using default placeholder');
      }
    }
  } catch (error) {
    // Increment failure count for circuit breaker
    consecutiveFailures++;
    if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreakerOpen = true;
      circuitBreakerOpenTime = Date.now();
      console.warn('Circuit breaker opened due to consecutive failures');
    }
    
    // Retry logic for network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || error.message.includes('Connection refused')) {
      if (retryCount < 3) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return searchCollegeImage(collegeName, location, collegeId, retryCount + 1);
      }
    }
    
    // Don't log 404 errors as they're expected when backend is unavailable
    if (error.response?.status !== 404) {
      console.error('Error fetching image from MongoDB:', error.response?.data || error.message);
    }
  }
  
  return null;
};

/**
 * Generate a better hash from college name and location
 * This ensures each college gets a unique image
 */
const generateHash = (collegeName, location) => {
  const str = `${collegeName}_${location || ''}`.toLowerCase();
  let hash = 0;
  
  // Use a better hash algorithm (djb2 variant)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add location hash for more diversity
  if (location) {
    const locHash = location.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    hash = hash + locHash;
  }
  
  return Math.abs(hash);
};


/**
 * Get college image URL from MongoDB database
 * Returns college-specific images from database when available
 * @param {string} collegeName - Name of college
 * @param {string} location - Location of college (optional)
 * @param {string} collegeId - MongoDB ID of college (optional, helps with caching)
 */
export const getCollegeImageUrl = async (collegeName, location = '', collegeId = null) => {
  if (!collegeName) {
    return getDefaultImage();
  }

  // Use collegeId as primary cache key if available, otherwise use name+location
  const cacheKey = collegeId 
    ? `id_${collegeId}`
    : `${collegeName.toLowerCase().trim()}_${location || ''}`;
    
  if (imageCache.has(cacheKey)) {
    const cachedUrl = imageCache.get(cacheKey);
    // Only use cache if it's a valid URL
    if (cachedUrl && cachedUrl !== 'undefined' && cachedUrl !== 'null') {
      return cachedUrl;
    } else {
      // Remove invalid cache entry
      imageCache.delete(cacheKey);
    }
  }

  // Check if there's already a pending request for this college
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create the pending request
  const imagePromise = (async () => {
    try {
      // Strategy 1: Try MongoDB database for college images
      // Backend will only use MongoDB, no external API calls
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching image for: ${collegeName} (${location})${collegeId ? ` [ID: ${collegeId}]` : ''}`);
      }
      let imageUrl = await searchCollegeImage(collegeName, location, collegeId);
      
      // If backend API fails or returns invalid URL, use default placeholder
      if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null' || typeof imageUrl !== 'string') {
        imageUrl = getDefaultImage();
      }
      
      // Cache the result using college name and location as key
      imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error('Error getting college image:', error);
      const defaultImg = getDefaultImage();
      imageCache.set(cacheKey, defaultImg);
      return defaultImg;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the pending request
  pendingRequests.set(cacheKey, imagePromise);
  
  return imagePromise;
};

/**
 * Get default placeholder image
 * Returns a generic placeholder image when no college image is found
 */
const getDefaultImage = () => {
  // Using a data URI fallback instead of external placeholder service
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23f3f4f6'/%3E%3Ctext x='320' y='180' font-family='Arial' font-size='18' fill='%236b7280' text-anchor='middle' dy='.3em'%3ECollege Image%3C/text%3E%3C/svg%3E";
};

/**
 * Preload image to check if it exists
 */
export const preloadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    let resolved = false;
    
    img.onload = () => {
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    };
    
    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    };
    
    // Set timeout to avoid hanging
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, 3000);
    
    img.src = url;
  });
};

/**
 * Clear image cache (useful for testing or refreshing images)
 */
export const clearImageCache = () => {
  imageCache.clear();
  pendingRequests.clear();
  // Reset circuit breaker
  consecutiveFailures = 0;
  circuitBreakerOpen = false;
  circuitBreakerOpenTime = 0;
  // Reset rate limiting
  requestCount = 0;
  lastRequestTime = 0;
};
