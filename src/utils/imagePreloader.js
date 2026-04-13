import { getCollegeImageUrl } from './collegeImageService';

/**
 * Preload images for a list of colleges to cache them before they're needed
 * This reduces individual API calls when college cards are rendered
 * CONSERVATIVE MODE: Only preload a few images to avoid API overload
 */
export const preloadCollegeImages = async (colleges) => {
  if (!colleges || !Array.isArray(colleges)) {
    return;
  }

  // Filter colleges that don't have images already
  const collegesNeedingImages = colleges.filter(college => 
    !college?.imageUrl && 
    !college?.image && 
    college?.name && 
    (college?._id || college?.id)
  );

  if (collegesNeedingImages.length === 0) {
    return; // All colleges already have images
  }

  // CONSERVATIVE: Only preload first 3 colleges to avoid API overload
  const maxPreload = Math.min(3, collegesNeedingImages.length);
  const collegesToPreload = collegesNeedingImages.slice(0, maxPreload);

  // Process one at a time with delays to avoid overwhelming the API
  for (let i = 0; i < collegesToPreload.length; i++) {
    const college = collegesToPreload[i];
    const collegeId = college?._id || college?.id;
    const location = typeof college?.location === 'string' 
      ? college.location 
      : `${college?.location?.city || ''}, ${college?.location?.state || ''}`.trim();
    
    try {
      await getCollegeImageUrl(college.name, location, collegeId);
    } catch (error) {
      // Silently fail for preloading - individual cards will handle errors
      console.debug(`Failed to preload image for ${college.name}:`, error.message);
    }

    // Add significant delay between requests (2 seconds)
    if (i < collegesToPreload.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
