import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { getCollegeImageUrl } from '../../../utils/collegeImageService';

const CollegeCard = ({ college, onBookmark, onCompare, onViewDetails, isSelected, onSelect }) => {
  const [isBookmarked, setIsBookmarked] = useState(college?.isBookmarked || false);
  // Initialize with existing imageUrl if available, otherwise null to trigger loading
  const [imageUrl, setImageUrl] = useState(
    college?.imageUrl || college?.image || null
  );
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      // Load image if we don't have one and we have a college name
      const hasImage = imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null';
      if (!hasImage && college?.name && !imageLoading) {
        setImageLoading(true);
        try {
          const locationStr = college?.location
            ? (typeof college.location === 'string'
              ? college.location
              : `${college.location.city || ''}, ${college.location.state || ''}`.trim())
            : '';
          const url = await getCollegeImageUrl(college.name, locationStr, college._id || college.id);
          if (url && url !== 'undefined' && url !== 'null') {
            setImageUrl(url);
          }
        } catch (error) {
          console.error('Error loading college image:', error);
        } finally {
          setImageLoading(false);
        }
      }
    };
    loadImage();
  }, [college?.name, college?._id, college?.id, college?.location]); // Depend on college identity and location

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark(college?.id || college?._id, !isBookmarked);
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return 'text-success bg-success/10 border-success/20';
    if (probability >= 40) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-error bg-error/10 border-error/20';
  };

  const getProbabilityIcon = (probability) => {
    if (probability >= 70) return 'TrendingUp';
    if (probability >= 40) return 'Minus';
    return 'TrendingDown';
  };

  return (
    <div className={`bg-card border rounded-lg shadow-card hover:shadow-modal transition-smooth ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}>
      {/* Header with selection and bookmark */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(college?._id || college?.id, e?.target?.checked)}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
          />
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getProbabilityColor(college?.admissionProbability)
            }`}>
            <div className="flex items-center space-x-1">
              <Icon name={getProbabilityIcon(college?.admissionProbability)} size={14} />
              <span>{college?.admissionProbability}%</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleBookmark}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icon
            name={isBookmarked ? "BookmarkCheck" : "Bookmark"}
            size={18}
            className={isBookmarked ? "text-primary" : ""}
          />
        </Button>
      </div>
      {/* College Image */}
      <div className="px-4 pb-3">
        <div className="w-full h-32 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
          {imageLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Image
              src={imageUrl || undefined}
              alt={college?.name || 'College image'}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
      {/* College Info */}
      <div className="px-4 pb-4">
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {college?.imageUrl || imageUrl ? (
              <Image
                src={college?.imageUrl || imageUrl || undefined}
                alt={`${college?.name || 'College'} logo`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Icon name="Building" size={20} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-base text-foreground truncate">
              {college?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {typeof college?.location === 'string'
                ? college.location
                : college?.location?.city && college?.location?.state
                  ? `${college.location.city}, ${college.location.state}`
                  : college?.location?.city || college?.location?.state || 'N/A'}
            </p>
          </div>
        </div>

        {/* Branch and Cutoff */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start justify-between gap-x-3">
            <span className="text-sm text-muted-foreground shrink-0 mt-0.5">Branch:</span>
            <span className="text-sm font-medium text-foreground text-right leading-relaxed">
              {college?.branch}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{new Date().getFullYear() - 1} Cutoff:</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {college?.previousCutoff}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Predicted {new Date().getFullYear()}:</span>
            <span className="text-sm font-mono font-medium text-primary">
              {college?.predictedCutoff}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">NIRF Rank</p>
            <p className="font-mono font-medium text-sm text-foreground">
              {college?.rankings?.nirf || college?.nirfRank ? `#${college?.rankings?.nirf || college?.nirfRank}` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Fees (₹)</p>
            <p className="font-mono font-medium text-sm text-foreground">
              {(() => {
                const feeValue = college?.fees?.annualTuitionFee || (typeof college?.fees === 'number' ? college.fees : null);
                if (feeValue && !isNaN(feeValue)) {
                  return `${(feeValue / 100000).toFixed(1)}L`;
                }
                return 'N/A';
              })()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Package</p>
            <p className="font-mono font-medium text-sm text-foreground">
              {(() => {
                const pkgValue = college?.placements?.averagePackage || college?.averagePackage;
                if (pkgValue && !isNaN(pkgValue)) {
                  const displayValue = pkgValue >= 10000 ? pkgValue / 100000 : pkgValue;
                  return `${parseFloat(displayValue).toFixed(1)}L`;
                }
                return 'N/A';
              })()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(college?._id || college?.id)}
            className="flex-1"
          >
            View Details
          </Button>

        </div>
      </div>
    </div>
  );
};

export default CollegeCard;