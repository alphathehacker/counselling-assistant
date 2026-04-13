import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MapView = ({ colleges, onCollegeSelect, className = "" }) => {
  const [selectedCollege, setSelectedCollege] = useState(null);

  // Mock coordinates for demonstration
  const collegeLocations = colleges?.map(college => ({
    ...college,
    lat: 28.6139 + (Math.random() - 0.5) * 0.5, // Delhi area with random offset
    lng: 77.2090 + (Math.random() - 0.5) * 0.5
  }));

  const handleMarkerClick = (college) => {
    setSelectedCollege(college);
  };

  const handleViewDetails = () => {
    if (selectedCollege) {
      onCollegeSelect(selectedCollege?.id);
      setSelectedCollege(null);
    }
  };

  return (
    <div className={`relative w-full h-96 lg:h-[600px] bg-muted rounded-lg overflow-hidden ${className}`}>
      {/* Google Maps Iframe */}
      <iframe
        width="100%"
        height="100%"
        loading="lazy"
        title="Colleges Map"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=28.6139,77.2090&z=10&output=embed"
        className="border-0"
      />
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 hover:bg-white"
        >
          <Icon name="Plus" size={16} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 hover:bg-white"
        >
          <Icon name="Minus" size={16} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/90 hover:bg-white"
        >
          <Icon name="Locate" size={16} />
        </Button>
      </div>
      {/* College Info Card */}
      {selectedCollege && (
        <div className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-card border border-border rounded-lg shadow-modal p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-heading font-semibold text-foreground mb-1">
                {selectedCollege?.name}
              </h4>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Icon name="MapPin" size={14} />
                <span className="text-sm">{selectedCollege?.location}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCollege(null)}
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">NIRF Ranking</span>
              <span className="text-sm font-medium text-foreground">#{selectedCollege?.ranking}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Annual Fees</span>
              <span className="text-sm font-medium text-foreground">₹{selectedCollege?.fees?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cutoff</span>
              <span className="text-sm font-medium text-foreground">{selectedCollege?.cutoff}</span>
            </div>
          </div>

          <Button
            onClick={handleViewDetails}
            size="sm"
            className="w-full"
          >
            View Details
          </Button>
        </div>
      )}
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3">
        <h5 className="font-heading font-medium text-sm text-foreground mb-2">Legend</h5>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-xs text-foreground">High Probability</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span className="text-xs text-foreground">Medium Probability</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-error rounded-full"></div>
            <span className="text-xs text-foreground">Low Probability</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;