import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { getCollegeImageUrl } from '../../../utils/collegeImageService';

/**
 * bookmark = {
 *   bookmarkId,
 *   collegeId: { ...college },
 *   collegeName,
 *   priority,
 *   notes,
 *   tags,
 *   predictionData,
 *   type,
 *   ...
 * }
 */
const BookmarkCard = ({
  college: bookmark,
  onRemove,
  onShare,
  onViewDetails,
  onUpdateNotes,
  onUpdateTags,
  onUpdatePriority,
  isSelected,
  onSelect,
  showCheckbox = false,
  viewMode = 'grid'
}) => {
  // Get college data from multiple possible sources
  const college = bookmark?.college || bookmark?.collegeId || {};
  const bookmarkCollegeId = bookmark?.collegeId;
  const resolvedCollegeId =
    typeof bookmarkCollegeId === 'object'
      ? bookmarkCollegeId?._id || bookmarkCollegeId?.id
      : bookmarkCollegeId;
  const bookmarkId =
    bookmark?.bookmarkId ||
    resolvedCollegeId ||
    bookmark?._id ||
    bookmark?.id;
  const collegeIdForDetails = college?._id || bookmarkId;
  const collegeName = bookmark?.collegeName || bookmark?.name || college?.name || 'N/A';

  const [imageUrl, setImageUrl] = useState(college?.imageUrl || college?.logo || null);
  const [imageLoading, setImageLoading] = useState(false);

  const isFavorite = bookmark?.priority === 'high';

  /* -------------------- Load Image -------------------- */
  useEffect(() => {
    const loadImage = async () => {
      const hasImage = imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null';
      if (!hasImage && collegeName && !imageLoading) {
        setImageLoading(true);
        try {
          const locationStr =
            typeof college?.location === 'string'
              ? college.location
              : college?.location?.city && college?.location?.state
                ? `${college.location.city}, ${college.location.state}`
                : '';
          const url = await getCollegeImageUrl(collegeName, locationStr, college?._id);
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
  }, [collegeName, college?._id, college?.location]);

  /* -------------------- Helpers -------------------- */
  const getProbabilityColor = (probability = 0) => {
    if (probability >= 70) return 'text-success bg-success/10 border-success/20';
    if (probability >= 40) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-error bg-error/10 border-error/20';
  };

  const getProbabilityIcon = (probability = 0) => {
    if (probability >= 70) return 'TrendingUp';
    if (probability >= 40) return 'Minus';
    return 'TrendingDown';
  };

  const handleRemoveClick = () => {
    onRemove(bookmark);
  };

  const locationStr =
    typeof college?.location === 'string'
      ? college.location
      : college?.location?.city && college?.location?.state
        ? `${college.location.city}, ${college.location.state}`
        : college?.fullLocation?.city && college?.fullLocation?.state
          ? `${college.fullLocation.city}, ${college.fullLocation.state}`
          : 'N/A';

  const nirfRank = college?.rankings?.nirf || college?.nirfRank || college?.ranking;
  const feesRaw =
    college?.fees?.annualTuitionFee ||
    (typeof college?.fees === 'number' ? college?.fees : null);
  // avgPackage is stored in LPA in the DB (e.g. 19.1)
  const avgPackage =
    college?.placements?.averagePackage || college?.averagePackage;

  /* -------------------- LIST VIEW -------------------- */
  if (viewMode === 'list') {
    return (
      <div className="bg-card border border-border rounded-lg transition-smooth hover:shadow-card p-4 flex items-center space-x-4">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(bookmarkId, e.target.checked)}
            className="w-4 h-4"
          />
        )}

        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt={`${collegeName} logo`} className="w-full h-full object-cover" />
          ) : (
            <Icon name="Building2" size={20} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-ellipsis whitespace-nowrap overflow-hidden flex-1 min-w-0 max-w-[200px]">
              {collegeName}
            </h3>
            {bookmark?.probability && (
              <span className={`px-2 py-1 rounded-full text-xs border ${getProbabilityColor(bookmark.probability)}`}>
                {bookmark.probability}%
              </span>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-1">
            <Icon name="MapPin" size={12} className="inline mr-1" />
            {locationStr}
            <span className="mx-2">•</span>
            {college?.type || college?.collegeType || bookmark?.type || 'N/A'}
            <span className="mx-2">•</span>
            NIRF: {nirfRank ? `#${nirfRank}` : 'N/A'}
            <span className="mx-2">•</span>
            Fees: {feesRaw ? `${(feesRaw / 100000).toFixed(1)}L` : 'N/A'}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(bookmarkId)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onShare(bookmark)}>
            <Icon name="Share2" size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRemoveClick} className="text-error">
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------- COMPACT VIEW -------------------- */
  if (viewMode === 'compact') {
    return (
      <div className="bg-card border border-border rounded-lg transition-smooth hover:shadow-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(bookmarkId, e.target.checked)}
                className="w-3 h-3"
              />
            )}
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <Image src={imageUrl} alt={`${collegeName} logo`} className="w-full h-full object-cover" />
              ) : (
                <Icon name="Building2" size={14} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-sm text-ellipsis whitespace-nowrap overflow-hidden flex-1 min-w-0 max-w-[150px]">
                  {collegeName}
                </h4>
                {bookmark?.probability && (
                  <span className={`px-1 py-0.5 rounded text-xs border ${getProbabilityColor(bookmark.probability)}`}>
                    {bookmark.probability}%
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{locationStr}</div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={() => onShare(bookmark)} className="w-5 h-5">
              <Icon name="Share2" size={10} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRemoveClick} className="text-error w-5 h-5">
              <Icon name="Trash2" size={10} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- GRID VIEW (matches CollegeCard style) -------------------- */
  return (
    <div className={`bg-card border rounded-lg shadow-card hover:shadow-modal transition-smooth ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}>
      {/* Header: checkbox + probability badge + bookmark/remove */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(bookmarkId, e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
          )}
          {bookmark?.probability ? (
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getProbabilityColor(bookmark.probability)}`}>
              <div className="flex items-center space-x-1">
                <Icon name={getProbabilityIcon(bookmark.probability)} size={14} />
                <span>{bookmark.probability}%</span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full border text-sm font-medium text-primary bg-primary/10 border-primary/20">
              <div className="flex items-center space-x-1">
                <Icon name="Bookmark" size={14} />
                <span>Saved</span>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemoveClick}
          className="text-muted-foreground hover:text-error"
          title="Remove bookmark"
        >
          <Icon name="BookmarkCheck" size={18} className="text-primary" />
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
              alt={collegeName}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* College Info */}
      <div className="px-4 pb-4">
        {/* Logo + Name + Location */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${collegeName} logo`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Icon name="Building" size={20} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-base text-foreground truncate">
              {collegeName}
            </h3>
            <p className="text-sm text-muted-foreground">{locationStr}</p>
          </div>
        </div>

        {/* Branch and Cutoff Info */}
        <div className="space-y-2 mb-4">
          {(bookmark?.branch || college?.branch || bookmark?.predictionData?.branch) && (
            <div className="flex items-start justify-between gap-x-3">
              <span className="text-sm text-muted-foreground shrink-0 mt-0.5">Branch:</span>
              <span className="text-sm font-medium text-foreground text-right leading-relaxed">
                {bookmark?.branch || college?.branch || bookmark?.predictionData?.branch}
              </span>
            </div>
          )}
          {(college?.type || college?.collegeType) && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="text-sm font-medium text-foreground">
                {college?.type || college?.collegeType}
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid: NIRF Rank | Fees | Avg Package */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">NIRF Rank</p>
            <p className="font-mono font-medium text-sm text-foreground">
              {nirfRank ? `#${nirfRank}` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Fees (₹)</p>
            <p className="font-mono font-medium text-sm text-foreground">
              {feesRaw ? `${(feesRaw / 100000).toFixed(1)}L` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Package</p>
            <p className="font-mono font-medium text-sm text-foreground">
              {avgPackage
                ? `${(avgPackage >= 100 ? (avgPackage / 100000).toFixed(1) : avgPackage.toFixed(1))}L`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(bookmarkId)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveClick}
            className="text-error border-error/30 hover:bg-error/10"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkCard;
