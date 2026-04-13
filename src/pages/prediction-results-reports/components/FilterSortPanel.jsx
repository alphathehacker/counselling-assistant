import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterSortPanel = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  sortBy, 
  sortOrder, 
  onSortChange 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const probabilityOptions = [
    { value: 'high', label: 'High (70%+)' },
    { value: 'moderate', label: 'Moderate (40-69%)' },
    { value: 'low', label: 'Low (<40%)' }
  ];

  const locationOptions = [
    { value: 'delhi', label: 'Delhi' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'chennai', label: 'Chennai' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'pune', label: 'Pune' }
  ];

  const collegeTypeOptions = [
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private' },
    { value: 'deemed', label: 'Deemed University' }
  ];

  const sortOptions = [
    { value: 'probability', label: 'Admission Probability' },
    { value: 'ranking', label: 'NIRF Ranking' },
    { value: 'fees', label: 'Annual Fees' },
    { value: 'package', label: 'Average Package' },
    { value: 'alphabetical', label: 'College Name' }
  ];

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount = Object.values(localFilters)?.filter(value => 
    value && (Array.isArray(value) ? value?.length > 0 : true)
  )?.length;

  const panelContent = (
    <div className="bg-card h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="font-heading font-semibold text-lg text-foreground">
            Filter & Sort
          </h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
        >
          <Icon name="X" size={20} />
        </Button>
      </div>

      {/* Sort Section */}
      <div className="p-4 border-b border-border">
        <h4 className="font-heading font-medium text-sm text-foreground mb-3">
          Sort Results
        </h4>
        <div className="space-y-3">
          <Select
            label="Sort by"
            options={sortOptions}
            value={sortBy}
            onChange={onSortChange}
            placeholder="Select sorting option"
          />
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="sortOrder"
                value="asc"
                checked={sortOrder === 'asc'}
                onChange={(e) => onSortChange(sortBy, e?.target?.value)}
                className="w-4 h-4 text-primary border-border focus:ring-primary"
              />
              <span className="text-sm text-foreground">Ascending</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="sortOrder"
                value="desc"
                checked={sortOrder === 'desc'}
                onChange={(e) => onSortChange(sortBy, e?.target?.value)}
                className="w-4 h-4 text-primary border-border focus:ring-primary"
              />
              <span className="text-sm text-foreground">Descending</span>
            </label>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Probability Filter */}
        <div>
          <label className="block font-heading font-medium text-sm text-foreground mb-3">
            Admission Probability
          </label>
          <div className="space-y-2">
            {probabilityOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={localFilters?.probability?.includes(option?.value) || false}
                onChange={(e) => {
                  const currentProb = localFilters?.probability || [];
                  const updatedProb = e?.target?.checked
                    ? [...currentProb, option?.value]
                    : currentProb?.filter(p => p !== option?.value);
                  handleFilterChange('probability', updatedProb);
                }}
              />
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block font-heading font-medium text-sm text-foreground mb-3">
            Location
          </label>
          <Select
            options={locationOptions}
            value={localFilters?.location || []}
            onChange={(value) => handleFilterChange('location', value)}
            multiple
            searchable
            placeholder="Select locations"
          />
        </div>

        {/* College Type Filter */}
        <div>
          <label className="block font-heading font-medium text-sm text-foreground mb-3">
            College Type
          </label>
          <div className="space-y-2">
            {collegeTypeOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={localFilters?.collegeType?.includes(option?.value) || false}
                onChange={(e) => {
                  const currentTypes = localFilters?.collegeType || [];
                  const updatedTypes = e?.target?.checked
                    ? [...currentTypes, option?.value]
                    : currentTypes?.filter(type => type !== option?.value);
                  handleFilterChange('collegeType', updatedTypes);
                }}
              />
            ))}
          </div>
        </div>

        {/* Fees Range Filter */}
        <div>
          <label className="block font-heading font-medium text-sm text-foreground mb-3">
            Annual Fees Range (₹)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Min fees"
              value={localFilters?.feesMin || ''}
              onChange={(e) => handleFilterChange('feesMin', e?.target?.value)}
            />
            <Input
              type="number"
              placeholder="Max fees"
              value={localFilters?.feesMax || ''}
              onChange={(e) => handleFilterChange('feesMax', e?.target?.value)}
            />
          </div>
        </div>

        {/* NIRF Ranking Filter */}
        <div>
          <label className="block font-heading font-medium text-sm text-foreground mb-3">
            NIRF Ranking Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="From rank"
              value={localFilters?.rankingMin || ''}
              onChange={(e) => handleFilterChange('rankingMin', e?.target?.value)}
            />
            <Input
              type="number"
              placeholder="To rank"
              value={localFilters?.rankingMax || ''}
              onChange={(e) => handleFilterChange('rankingMax', e?.target?.value)}
            />
          </div>
        </div>

        {/* Package Range Filter */}
        <div>
          <label className="block font-heading font-medium text-sm text-foreground mb-3">
            Average Package Range (LPA)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Min LPA"
              value={localFilters?.packageMin || ''}
              onChange={(e) => handleFilterChange('packageMin', e?.target?.value)}
            />
            <Input
              type="number"
              placeholder="Max LPA"
              value={localFilters?.packageMax || ''}
              onChange={(e) => handleFilterChange('packageMax', e?.target?.value)}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 p-4 border-t border-border bg-card">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile: Render as modal
  if (window.innerWidth < 1024) {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-250 lg:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Panel */}
        <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-card rounded-t-lg">
          {panelContent}
        </div>
      </div>
    );
  }

  // Desktop: Render as sidebar
  if (!isOpen) return null;
  
  return (
    <div className="hidden lg:block w-80 flex-shrink-0 border-r border-border">
      {panelContent}
    </div>
  );
};

export default FilterSortPanel;