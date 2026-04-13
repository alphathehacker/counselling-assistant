import React from 'react';

function Image({
  src,
  alt = "Image Name",
  className = "",
  fallbackIcon = "Building2",
  ...props
}) {
  const [hasError, setHasError] = React.useState(false);
  const [useIconFallback, setUseIconFallback] = React.useState(false);

  // Handle image error
  const handleError = (e) => {
    if (!hasError) {
      setHasError(true);
      // Try to load a data URI fallback image
      const fallbackDataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
      
      if (e.target.src !== fallbackDataUri) {
        e.target.src = fallbackDataUri;
      } else {
        // If even the fallback fails, use icon
        setUseIconFallback(true);
      }
    }
  };

  // If we should use icon fallback
  if (useIconFallback) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} {...props}>
        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    );
  }

  // Ensure src is a valid string
  const imageSrc = (src && typeof src === 'string' && src.trim() !== '') ? src : null;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}

export default Image;
