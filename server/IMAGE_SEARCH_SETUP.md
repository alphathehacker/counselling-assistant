# College Image Search Setup

To get **actual real images** of specific colleges, you need to configure image search API keys.

## Option 1: Google Custom Search API (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Custom Search API"
4. Create credentials (API Key)
5. Create a Custom Search Engine at [Google Custom Search](https://cse.google.com/cse/)
6. Enable "Image Search" in your CSE settings
7. Get your Search Engine ID (CX)

Add to `.env`:
```
GOOGLE_CSE_API_KEY=your-api-key-here
GOOGLE_CSE_ID=your-search-engine-id-here
```

## Option 2: Bing Image Search API

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a "Bing Search v7" resource
3. Get your subscription key

Add to `.env`:
```
BING_IMAGE_SEARCH_API_KEY=your-subscription-key-here
```

## Option 3: Unsplash API (Free)

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create an application
3. Get your Access Key

Add to `.env`:
```
UNSPLASH_ACCESS_KEY=your-access-key-here
```

## Option 4: SerpAPI (Free Tier: 100 searches/month)

1. Go to [SerpAPI](https://serpapi.com/)
2. Sign up for free account
3. Get your API key

Add to `.env`:
```
SERP_API_KEY=your-api-key-here
```

## Current Behavior

Without API keys, the system uses:
- Unsplash Source API (deprecated, keyword-based search)
- This may not return actual college photos, but will search for images matching the college name

**For best results, configure at least one of the above API keys.**

