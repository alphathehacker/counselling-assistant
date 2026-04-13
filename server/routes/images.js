import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import College from '../models/College.js';

const router = express.Router();

/**
 * Search for actual college images using a free image search API
 * Uses SerpAPI free tier or constructs search URLs
 * @param {string} query - The search query
 * @param {string} collegeName - The original college name for matching validation
 */
const searchCollegeImagesWeb = async (query, collegeName = '') => {
  try {
    // Option 1: Use SerpAPI (free tier - 100 searches/month)
    const serpApiKey = process.env.SERP_API_KEY;
    console.log('SerpAPI Key check:', serpApiKey ? 'Found' : 'Not found');
    
    if (serpApiKey && serpApiKey !== 'your-serpapi-key') {
      try {
        console.log(`Searching SerpAPI for: "${query}"`);
        const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&safe=active`;
        const response = await axios.get(serpUrl, { timeout: 10000 });
        
        console.log('SerpAPI response status:', response.status);
        
        if (response.data && response.data.images_results && response.data.images_results.length > 0) {
          // Try to find the best matching image
          // Look for images where the title or source contains the college name
          const collegeNameLower = (collegeName || query).toLowerCase();
          const collegeNameWords = collegeNameLower.split(/\s+/).filter(w => w.length > 3); // Get significant words
          
          let bestMatch = null;
          let bestScore = 0;
          
          // Check first 5 results to find the best match
          const resultsToCheck = response.data.images_results.slice(0, 5);
          
          for (const image of resultsToCheck) {
            let score = 0;
            const title = (image.title || '').toLowerCase();
            const source = (image.source || '').toLowerCase();
            const link = (image.link || '').toLowerCase();
            
            // Check if college name words appear in title, source, or link
            collegeNameWords.forEach(word => {
              if (title.includes(word)) score += 2;
              if (source.includes(word)) score += 1;
              if (link.includes(word)) score += 1;
            });
            
            // Bonus if full college name appears
            if (title.includes(collegeNameLower) || source.includes(collegeNameLower)) {
              score += 5;
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = image;
            }
          }
          
          // Use best match if found, otherwise use first result
          // Only accept if score is reasonable (at least 2 points means some words matched)
          const minScore = 2;
          if (bestScore >= minScore) {
            const selectedImage = bestMatch || response.data.images_results[0];
            const imageUrl = selectedImage.original || selectedImage.link;
            
            console.log(`SerpAPI found image (score: ${bestScore}):`, imageUrl);
            console.log(`  Title: ${selectedImage.title || 'N/A'}`);
            console.log(`  Source: ${selectedImage.source || 'N/A'}`);
            
            return imageUrl;
          } else {
            console.log(`SerpAPI image match score too low (${bestScore} < ${minScore}), trying first result anyway`);
            // Still return first result but log the low score
            const selectedImage = response.data.images_results[0];
            const imageUrl = selectedImage.original || selectedImage.link;
            console.log(`  Using first result: ${imageUrl}`);
            console.log(`  Title: ${selectedImage.title || 'N/A'}`);
            return imageUrl;
          }
        } else {
          console.log('SerpAPI returned no images');
        }
      } catch (error) {
        console.error('SerpAPI search error:', error.response?.data || error.message);
        if (error.response) {
          console.error('SerpAPI error status:', error.response.status);
          console.error('SerpAPI error data:', error.response.data);
        }
      }
    } else {
      console.warn('SerpAPI key not configured or is placeholder');
    }
    
    // Option 2: Use DuckDuckGo HTML search (free, no API key)
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(ddgUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      // Look for image results
      $('a.result__a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('images')) {
          // This is an image result link
          // We'd need to follow it to get the actual image URL
        }
      });
    } catch (error) {
      console.warn('DuckDuckGo search failed:', error.message);
    }
    
  } catch (error) {
    console.warn('Web image search failed:', error.message);
  }
  
  return null;
};

/**
 * Search for college image using Google Custom Search (if API key available)
 * This would require GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env
 */
const searchGoogleImages = async (query) => {
  try {
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !searchEngineId) {
      return null; // No API keys configured
    }
    
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=1`;
    
    const response = await axios.get(searchUrl, { timeout: 5000 });
    
    if (response.data && response.data.items && response.data.items.length > 0) {
      return response.data.items[0].link;
    }
  } catch (error) {
    console.warn('Google search failed:', error.message);
  }
  
  return null;
};

/**
 * Search for college image using Bing Image Search (if API key available)
 */
const searchBingImages = async (query) => {
  try {
    const apiKey = process.env.BING_IMAGE_SEARCH_API_KEY;
    
    if (!apiKey) {
      return null; // No API key configured
    }
    
    const searchUrl = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}&count=1&license=public`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      },
      timeout: 5000
    });
    
    if (response.data && response.data.value && response.data.value.length > 0) {
      return response.data.value[0].contentUrl;
    }
  } catch (error) {
    console.warn('Bing search failed:', error.message);
  }
  
  return null;
};


/**
 * Search for actual college images using multiple strategies
 * Checks MongoDB first (including useDatabaseOnly). When useDatabaseOnly is true,
 * does not call SerpAPI/Google/Bing (avoids quota and 401/429 errors).
 */
router.post('/search', protect, async (req, res) => {
  try {
    const { collegeName, location, collegeId, useDatabaseOnly } = req.body;

    if (!collegeName) {
      return res.status(400).json({
        success: false,
        message: 'College name is required',
      });
    }

    const rawCollegeName = collegeName.toString().trim();

    // Guard: sometimes bad CSV data / parsing can send an email/mailto as "college name"
    // In that case, skip DB + external searches to avoid polluting cache and burning quotas.
    const looksLikeEmail =
      /^mailto:/i.test(rawCollegeName) ||
      (rawCollegeName.includes('@') && !rawCollegeName.includes(' '));
    if (looksLikeEmail) {
      return res.json({
        success: true,
        imageUrl: null,
        collegeName: rawCollegeName,
        location: location,
        cached: false,
      });
    }

    let imageUrl = null;
    let college = null;

    const isValidImageUrlField = {
      $exists: true,
      $type: 'string',
      $nin: ['', 'null', 'undefined'],
    };

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Loose normalization for matching (handles commas, dots, extra spaces, etc.)
    const normalizeNameForWords = (name) =>
      name
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const buildLooseWordsRegex = (name) => {
      const words = normalizeNameForWords(name)
        .split(' ')
        .filter((w) => w.length > 2);
      if (words.length === 0) return null;
      return new RegExp(words.map(escapeRegex).join('.*'), 'i');
    };

    // Helper: find college in MongoDB by various name strategies (for IITs and similar)
    const findCollegeWithImage = async () => {
      // 1) By ID if valid ObjectId
      if (collegeId && mongoose.Types.ObjectId.isValid(collegeId)) {
        const byId = await College.findById(collegeId);
        if (byId && byId.imageUrl) return byId;
      }

      const nameExactEscaped = escapeRegex(rawCollegeName);
      const looseWordsRegex = buildLooseWordsRegex(rawCollegeName);
      const locationPart =
        typeof location === 'string' ? location.split(',')[0].trim() : (location?.city || '').toString().trim();

      // 2) Exact name match (case-insensitive)
      const exact = await College.findOne({
        name: new RegExp(`^${nameExactEscaped}$`, 'i'),
        imageUrl: isValidImageUrlField,
      });
      if (exact) return exact;

      // 3) Name contains full string
      const byName = await College.findOne({
        name: { $regex: new RegExp(nameExactEscaped, 'i') },
        imageUrl: isValidImageUrlField,
      });
      if (byName) return byName;

      // 3b) If we have a location, prefer a match in that city/state (helps NEET colleges)
      if (locationPart) {
        const withLocation = await College.findOne({
          $and: [
            { imageUrl: isValidImageUrlField },
            {
              $or: [
                { 'location.city': { $regex: new RegExp(escapeRegex(locationPart), 'i') } },
                { 'location.state': { $regex: new RegExp(escapeRegex(locationPart), 'i') } },
                { 'location.district': { $regex: new RegExp(escapeRegex(locationPart), 'i') } },
              ],
            },
            { name: { $regex: looseWordsRegex || new RegExp(nameExactEscaped, 'i') } },
          ],
        });
        if (withLocation) return withLocation;
      }

      // 4) For IITs: try "IIT <Place>" e.g. "IIT Bhilai", "IIT Goa"
      const iitMatch = rawCollegeName.match(/Indian Institute of Technology\s*\((?:BHU|ISM)\)\s*(\w+)|Indian Institute of Technology\s+(\w+)/i);
      if (iitMatch) {
        const place = (iitMatch[1] || iitMatch[2] || '').trim();
        if (place) {
          const byShort = await College.findOne({
            $and: [
              { imageUrl: isValidImageUrlField },
              { $or: [
                { name: new RegExp(`IIT\\s+${place}`, 'i') },
                { shortName: new RegExp(place, 'i') },
                { name: new RegExp(place, 'i') }
              ] }
            ]
          });
          if (byShort) return byShort;
        }
      }
      // 5) Any college whose name contains the given name (e.g. partial)
      let partial = null;
      if (looseWordsRegex) {
        partial = await College.findOne({
          name: { $regex: looseWordsRegex },
          imageUrl: isValidImageUrlField,
        });
      }

      return partial || null;
    };

    // STEP 1: Check MongoDB first for cached image URL (use flexible matching)
    try {
      college = await findCollegeWithImage();
      if (college && college.imageUrl) {
        if (!useDatabaseOnly) {
          console.log(`✓ Found cached image URL in MongoDB for "${collegeName}"`);
        }
        return res.json({
          success: true,
          imageUrl: college.imageUrl,
          collegeName: collegeName,
          location: location,
          cached: true,
        });
      }
    } catch (dbError) {
      console.warn('Error checking MongoDB for cached image:', dbError.message);
    }

    // If client asked for database-only, do not call external APIs (SerpAPI quota / 401s)
    if (useDatabaseOnly) {
      return res.json({
        success: true,
        imageUrl: null,
        collegeName: collegeName,
        location: location,
        cached: false,
      });
    }

    // STEP 2: Image not found in MongoDB, fetch from SerpAPI (only when not useDatabaseOnly)
    console.log(`Image not found in cache for "${collegeName}", fetching from SerpAPI...`);

    // Log API key status (first 10 chars only for security)
    const serpKey = process.env.SERP_API_KEY;
    if (serpKey && serpKey !== 'your-serpapi-key') {
      console.log(`✓ SerpAPI Key configured: ${serpKey.substring(0, 10)}...`);
    } else {
      console.warn('⚠️ SerpAPI Key NOT found or is placeholder! Check your .env file.');
    }

    // Build a more specific search query for the actual college
    // Clean the college name to remove common abbreviations and make it more searchable
    let cleanCollegeName = collegeName
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s*-\s*/g, ' ') // Remove hyphens
      .replace(/\s*&\s*/g, ' ') // Remove ampersands
      .trim();
    
    // Handle location as either string or object
    let locationPart = '';
    if (location) {
      if (typeof location === 'string') {
        locationPart = location.split(',')[0].trim();
      } else if (typeof location === 'object' && location.city) {
        locationPart = location.city.trim();
      }
    }
    
    // Create multiple search queries with increasing specificity
    // Try the most specific first: full name + location + "college" or "university"
    let searchQuery;
    if (locationPart) {
      // Use the most specific query: college name + location + college/university keyword
      const collegeType = cleanCollegeName.toLowerCase().includes('university') ? '' : 'college';
      searchQuery = `${cleanCollegeName} ${locationPart} ${collegeType}`.trim();
    } else {
      searchQuery = `${cleanCollegeName} college`;
    }
    
    console.log(`Searching SerpAPI for college image: "${searchQuery}" (original: "${collegeName}")`);
    
    // Try multiple image search strategies in order of preference
    // Strategy 1: SerpAPI (PRIORITY - we have the API key configured)
    // This should be the primary method for real college images
    console.log('Attempting SerpAPI search...');
    imageUrl = await searchCollegeImagesWeb(searchQuery, collegeName);
    if (imageUrl) {
      console.log('✓ Successfully got image from SerpAPI:', imageUrl);
    } else {
      console.log('✗ SerpAPI did not return an image');
    }
    
    // Strategy 2: Google Custom Search (if API key available)
    if (!imageUrl) {
      imageUrl = await searchGoogleImages(searchQuery);
    }
    
    // Strategy 3: Bing Image Search (if API key available)
    if (!imageUrl) {
      imageUrl = await searchBingImages(searchQuery);
    }
    
    // If no image found from any API, return null
    // The frontend will handle displaying a default placeholder
    if (!imageUrl) {
      console.log('All API searches failed, no image found');
    }
    
    // STEP 3: Save image URL to MongoDB for future use (only if we got a real image from APIs)
    if (imageUrl && college) {
      try {
        college.imageUrl = imageUrl;
        await college.save();
        console.log(`✓ Saved image URL to MongoDB for "${collegeName}"`);
      } catch (saveError) {
        console.warn('Error saving image URL to MongoDB:', saveError.message);
        // Continue even if save fails
      }
    } else if (imageUrl && !college) {
      // If college doesn't exist in DB yet, try to create/update by name
      try {
        const searchQuery = { name: { $regex: new RegExp(collegeName, 'i') } };
        if (location) {
          if (typeof location === 'string') {
            const locationParts = location.split(',').map(part => part.trim());
            if (locationParts[0]) {
              searchQuery['location.city'] = { $regex: new RegExp(locationParts[0], 'i') };
            }
          } else if (typeof location === 'object' && location.city) {
            searchQuery['location.city'] = { $regex: new RegExp(location.city, 'i') };
          }
        }
        const existingCollege = await College.findOne(searchQuery);
        
        if (existingCollege) {
          existingCollege.imageUrl = imageUrl;
          await existingCollege.save();
          console.log(`✓ Saved image URL to existing college in MongoDB`);
        } else {
          // College doesn't exist, we can't save without more data
          console.log('College not found in MongoDB, cannot save image URL');
        }
      } catch (saveError) {
        console.warn('Error saving image URL to MongoDB:', saveError.message);
      }
    }
    
    console.log(`Final image URL for "${collegeName}":`, imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      searchQuery: searchQuery,
      collegeName: collegeName,
      location: location,
      cached: false, // Indicate this was fetched fresh
    });
  } catch (error) {
    console.error('Error searching for college image:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for image',
      error: error.message,
    });
  }
});

export default router;

