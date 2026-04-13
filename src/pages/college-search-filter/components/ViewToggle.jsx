import React from 'react';
import Icon from '../../../components/AppIcon';

const ViewToggle = ({ viewMode, onViewModeChange, className = "" }) => {
  const viewOptions = [
    { value: 'grid', icon: 'Grid3X3', label: 'Grid View' },
    { value: 'list', icon: 'List', label: 'List View' },
    { value: 'map', icon: 'Map', label: 'Map View' }
  ];

  return (
    <div className={`flex items-center bg-muted rounded-lg p-1 ${className}`}>
      {viewOptions?.map((option) => (
        <button
          key={option?.value}
          onClick={() => onViewModeChange(option?.value)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
            viewMode === option?.value
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={option?.label}
        >
          <Icon name={option?.icon} size={16} />
          <span className="hidden sm:inline">{option?.label?.split(' ')?.[0]}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;