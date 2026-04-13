import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const AdvancedFilters = ({ filters, onFiltersChange, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const collegeTypeOptions = [
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private' },
    { value: 'deemed', label: 'Deemed University' },
    { value: 'autonomous', label: 'Autonomous' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={`bg-card border border-border rounded-lg ${className}`}>
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
          className="w-full justify-between"
        >
          <div className="flex items-center space-x-2">
            <Icon name="Filter" size={16} />
            <span className="font-medium">Advanced Filters</span>
          </div>
        </Button>
      </div>
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* College Type */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-2">
              College Type
            </label>
            <div className="space-y-2">
              {collegeTypeOptions?.map((option) => (
                <Checkbox
                  key={option?.value}
                  label={option?.label}
                  checked={filters?.collegeType?.includes(option?.value) || false}
                  onChange={(e) => {
                    const currentTypes = filters?.collegeType || [];
                    const updatedTypes = e?.target?.checked
                      ? [...currentTypes, option?.value]
                      : currentTypes?.filter(type => type !== option?.value);
                    handleFilterChange('collegeType', updatedTypes);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Fee Range */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-2">
              Annual Fee Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min fee"
                value={filters?.feeMin || ''}
                onChange={(e) => handleFilterChange('feeMin', e?.target?.value)}
              />
              <Input
                type="number"
                placeholder="Max fee"
                value={filters?.feeMax || ''}
                onChange={(e) => handleFilterChange('feeMax', e?.target?.value)}
              />
            </div>
          </div>

          {/* Distance Preference */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-2">
              Maximum Distance from near by railway station (km)
            </label>
            <Input
              type="number"
              placeholder="Enter distance in km"
              value={filters?.maxDistance || ''}
              onChange={(e) => handleFilterChange('maxDistance', e?.target?.value)}
            />
          </div>

          {/* Placement Criteria */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-2">
              Minimum Average Package (LPA)
            </label>
            <Input
              type="number"
              placeholder="Enter minimum package"
              value={filters?.minPackage || ''}
              onChange={(e) => handleFilterChange('minPackage', e?.target?.value)}
            />
          </div>

          {/* NIRF Ranking */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-2">
              Maximum NIRF Ranking
            </label>
            <Input
              type="number"
              placeholder="Enter max ranking"
              value={filters?.maxRanking || ''}
              onChange={(e) => handleFilterChange('maxRanking', e?.target?.value)}
            />
          </div>

          {/* Reset Filters */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => onFiltersChange({})}
              iconName="RotateCcw"
              iconPosition="left"
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;