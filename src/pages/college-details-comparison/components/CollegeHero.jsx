import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const CollegeHero = ({ college, onBookmark, onShare, onAddToComparison, isBookmarked }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: college?.name,
        text: `Check out ${college?.name} - ${college?.location}`,
        url: window.location?.href
      });
    } else {
      onShare();
    }
  };

  return (
    <div className="relative bg-card border-b border-border">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src={college?.heroImage}
          alt={`${college?.name} campus`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <Icon name="Image" size={48} className="text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={onBookmark}
            className="bg-white/90 hover:bg-white"
          >
            <Icon 
              name={isBookmarked ? "BookmarkCheck" : "Bookmark"} 
              size={20} 
              className={isBookmarked ? "text-primary" : "text-foreground"}
            />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleShare}
            className="bg-white/90 hover:bg-white"
          >
            <Icon name="Share2" size={20} className="text-foreground" />
          </Button>
        </div>
      </div>
      {/* College Info */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Image
                src={college?.logo}
                alt={`${college?.name} logo`}
                className="w-12 h-12 rounded-lg object-cover border border-border"
              />
              <div>
                <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">
                  {college?.name}
                </h1>
                <p className="text-muted-foreground">{college?.shortName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center space-x-1">
                <Icon name="MapPin" size={16} />
                <span>{college?.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Calendar" size={16} />
                <span>Est. {college?.established}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Building2" size={16} />
                <span>{college?.type}</span>
              </div>
            </div>

            {/* Rankings */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                NIRF #{college?.rankings?.nirf}
              </div>
              <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                QS #{college?.rankings?.qs}
              </div>
              <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                Times #{college?.rankings?.times}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={onAddToComparison}
              iconName="Plus"
              iconPosition="left"
              className="sm:w-auto"
            >
              Add to Compare
            </Button>
            <Button
              variant="default"
              iconName="ExternalLink"
              iconPosition="right"
              className="sm:w-auto"
            >
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeHero;