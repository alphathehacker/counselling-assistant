import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { getCollegeImageUrl } from '../../../utils/collegeImageService';

const CollegeCard = ({ 
  college, 
  onBookmark, 
  onCompare, 
  onViewDetails, 
  isBookmarked = false,
  isComparing = false,
  viewMode = 'grid',
  className = "" 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use imageUrl from college data if available, otherwise fetch it
  const initialImageUrl = useMemo(() => college?.imageUrl || college?.image, [college?.imageUrl, college?.image]);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);

  // Get the college ID for this card
  const collegeId = useMemo(() => college?._id || college?.id, [college?._id, college?.id]);
  
  // Memoize location string
  const locationStr = useMemo(() => {
    if (!college?.location) return 'N/A';
    return typeof college.location === 'string' 
      ? college.location 
      : `${college.location.city || ''}, ${college.location.state || ''}`.trim();
  }, [college?.location]);

  // Load image only if not already available
  useEffect(() => {
    const loadImage = async () => {
      if (imageUrl || college?.imageUrl || college?.image) return;
      if (!college?.name || !collegeId) return;
      
      const url = await getCollegeImageUrl(college.name, locationStr, collegeId);
      setImageUrl(url);
    };
    loadImage();
  }, [college?.name, college?.imageUrl, college?.image, locationStr, collegeId, imageUrl]);

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (collegeId) onBookmark(collegeId);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    if (collegeId) onCompare(collegeId);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (collegeId) onViewDetails(collegeId);
  };

  const toggleExpand = (e) => {
    if (viewMode === 'list') {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    } else {
      handleViewDetails(e);
    }
  };

  const collegeType = college?.collegeType || college?.type || 'College';
  const nirfRank = college?.rankings?.nirf || college?.ranking;
  
  // SAFE DATA ACCESS FOR OBJECTS
  const fees = college?.fees?.annualTuitionFee || (typeof college?.fees === 'number' ? college.fees : null);
  const pkg = college?.placements?.averagePackage || (typeof college?.averagePackage === 'number' ? college.averagePackage : null);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return 'N/A';
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  const formatPackage = (val) => {
    if (!val || isNaN(val)) return 'N/A';
    const displayValue = val >= 10000 ? val / 100000 : val;
    return `${parseFloat(displayValue).toFixed(1)}L LPA`;
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={`bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
        onClick={toggleExpand}
      >
        <div className="flex flex-col md:flex-row items-center p-4">
          {/* Quick Image Thumbnail */}
          <div className="w-full md:w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <Image
              src={imageUrl}
              alt={college?.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0 mr-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-2 mb-1">
              <h3 className="font-heading font-bold text-lg text-foreground truncate max-w-full md:max-w-md">
                {college?.name}
              </h3>
              <span className="inline-block self-center md:self-auto px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                {collegeType}
              </span>
            </div>
            
            <p className="flex items-center justify-center md:justify-start text-sm text-muted-foreground mr-4">
              <Icon name="MapPin" size={14} className="mr-1 text-primary/60" />
              {locationStr}
            </p>

            {/* Quick Stats Inline (Only when collapsed) */}
            {!isExpanded && (
              <div className="mt-2 flex items-center justify-center md:justify-start space-x-6 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Icon name="DollarSign" size={12} className="mr-1" />
                  {formatCurrency(fees)}
                </span>
                <span className="flex items-center">
                  <Icon name="Briefcase" size={12} className="mr-1" />
                  {formatPackage(pkg)}
                </span>
                {nirfRank && (
                  <span className="flex items-center font-semibold text-primary">
                    <Icon name="Award" size={12} className="mr-1" />
                    Rank #{nirfRank}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Toggle/Action Icon */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBookmark}
              className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              <Icon name={isBookmarked ? "BookmarkCheck" : "Bookmark"} size={18} />
            </button>
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={20} className="text-muted-foreground/40" />
          </div>
        </div>

        {/* Micro-Expansion Content - ANIMATED */}
        <div 
          className={`bg-muted/20 border-t border-border/40 transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="p-4 md:px-8 md:pb-6 flex flex-col md:flex-row justify-between items-end md:items-center space-y-4 md:space-y-0">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Top Recruiter & Industry</p>
                <p className="text-sm font-medium text-foreground">
                  {Array.isArray(college?.placements?.topRecruiters) 
                    ? college.placements.topRecruiters.slice(0, 5).join(', ') 
                    : 'Microsoft, Google, Amazon, TCS, Infosys'}
                </p>
              </div>
              <div className="flex space-x-4">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Fees</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(fees)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Average Package</p>
                    <p className="text-sm font-semibold text-primary">{formatPackage(pkg)}</p>
                 </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleViewDetails}>Full Profile</Button>
              <Button 
                variant={isComparing ? "default" : "secondary"} 
                size="sm" 
                onClick={handleCompare}
                iconName={isComparing ? "Check" : "Plus"}
                iconPosition="left"
              >
                {isComparing ? 'Added' : 'Compare'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD GRID VIEW
  return (
    <div className={`bg-card border border-border rounded-xl shadow-card hover:shadow-modal transition-all duration-300 overflow-hidden group ${className}`}>
      <div className="relative h-48 bg-muted overflow-hidden">
        <Image
          src={imageUrl}
          alt={college?.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
            isBookmarked ? 'bg-primary text-white' : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-primary'
          }`}
        >
          <Icon name={isBookmarked ? "BookmarkCheck" : "Bookmark"} size={18} />
        </button>

        {nirfRank && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/20">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              NIRF Rank #{nirfRank}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h3 className="font-heading font-bold text-lg text-foreground line-clamp-1 mb-1" title={college?.name}>
            {college?.name}
          </h3>
          <div className="flex items-center text-muted-foreground">
            <Icon name="MapPin" size={14} className="mr-1 text-primary/60" />
            <span className="text-xs truncate">{locationStr}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2 bg-muted/50 rounded-lg border border-border/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Fees</p>
            <p className="text-xs font-semibold text-foreground">{formatCurrency(fees)}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg border border-border/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Avg Package</p>
            <p className="text-xs font-semibold text-foreground">{formatPackage(pkg)}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleViewDetails} className="flex-1 text-xs">Details</Button>
          <Button 
            variant={isComparing ? "default" : "secondary"} 
            size="sm" 
            onClick={handleCompare}
            className="flex-1 text-xs"
            iconName={isComparing ? "Check" : "Plus"}
          >
            {isComparing ? 'Stored' : 'Compare'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollegeCard;