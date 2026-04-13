import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const CollegeCard = ({ 
  college, 
  onBookmark, 
  onViewDetails 
}) => {
  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return value;
  };

  const getChanceColor = (probability) => {
    if (probability === 'high' || probability === 'good') {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (probability === 'moderate') {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getChanceText = (probability) => {
    if (probability === 'high' || probability === 'good') return 'High Chance';
    if (probability === 'moderate') return 'Moderate Chance';
    return 'Low Chance';
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'N/A';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPackage = (packageAmount) => {
    if (!packageAmount || packageAmount === 0) return 'N/A';
    if (packageAmount >= 100000) {
      return `₹${(packageAmount / 100000).toFixed(1)}L`;
    }
    return `₹${packageAmount.toLocaleString('en-IN')}`;
  };

  const closingRankRaw =
    college?.closingRank ??
    college?.cutoffRank ??
    college?.cutoff_rank ??
    null;
  const closingRankDisplay = closingRankRaw
    ? Number(closingRankRaw).toLocaleString('en-IN')
    : 'N/A';

  const nearestRailway =
    college?.nearestRailway ??
    college?.nearest_railway ??
    college?.fullLocation?.nearestRailway ??
    college?.fullLocation?.nearest_railway ??
    null;

  const nearestBusStand =
    college?.nearestBusStand ??
    college?.nearest_bus_stand ??
    college?.fullLocation?.nearestBusStand ??
    college?.fullLocation?.nearest_bus_stand ??
    null;

  const campusArea =
    college?.campusArea ??
    college?.campus_area ??
    college?.fullLocation?.campusArea ??
    college?.fullLocation?.campus_area ??
    null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-modal transition-smooth">
      <div className="flex flex-col md:flex-row">
        {/* College Image - Wide rectangular for better view */}
        <div className="w-full md:w-[450px] h-64 md:h-[280px] bg-muted overflow-hidden flex-shrink-0">
          <Image
            src={college?.image}
            alt={college?.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* College Details */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-xl text-foreground mb-3">
                {college?.name}
              </h3>
              
              {/* Location & Type */}
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Icon name="MapPin" size={16} className="text-red-500" />
                  <span className="text-sm">{college?.location}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Icon name="Building" size={16} />
                  <span className="text-sm">{college?.type}</span>
                </div>
                {college?.ranking && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Icon name="Award" size={16} />
                    <span className="text-sm">NIRF #{college?.ranking}</span>
                  </div>
                )}
              </div>

              {/* Chance Indicator */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getChanceColor(college?.probability)}`}>
                  {getChanceText(college?.probability)}
                </span>
              </div>

              {/* Available Branches */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Available Branches: <span className="text-foreground font-medium">
                    {college?.availableBranches?.join(', ') || college?.branch || 'N/A'}
                  </span>
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Previous Cutoff</p>
                  <p className="text-sm font-medium text-foreground">
                    {getDisplayValue(college?.previousCutoff)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fees</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(college?.fees)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Package</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatPackage(college?.averagePackage)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Closing Rank</p>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {closingRankDisplay}
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-border">
                <div className="flex items-start space-x-2">
                  <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nearest Railway</p>
                    <p className="text-sm font-medium text-foreground">
                      {getDisplayValue(nearestRailway)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nearest Bus Stand</p>
                    <p className="text-sm font-medium text-foreground">
                      {getDisplayValue(nearestBusStand)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon name="Building" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Campus Area</p>
                    <p className="text-sm font-medium text-foreground">
                      {campusArea ? `${campusArea} acres` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBookmark(college?.id)}
                iconName={college?.isBookmarked ? "BookmarkCheck" : "Bookmark"}
                iconPosition="left"
                className="whitespace-nowrap"
              >
                {college?.isBookmarked ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(college?.id)}
                className="whitespace-nowrap"
              >
                View Details
              </Button>
            </div>
          </div>

          {/* Recommended Badge */}
          {college?.isRecommended && (
            <div className="flex items-center space-x-1 text-green-600 mt-4 pt-4 border-t border-border">
              <Icon name="CheckCircle" size={16} />
              <span className="text-sm font-medium">Recommended</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeCard;

