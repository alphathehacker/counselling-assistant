import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const SearchAndFilter = ({ 
  searchQuery, 
  onSearchChange, 
  sortBy, 
  onSortChange, 
  filters, 
  onFiltersChange,
  onClearFilters 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: 'name', label: 'College Name' },
    { value: 'probability', label: 'Admission Probability' },
    { value: 'fees', label: 'Fees (Low to High)' },
    { value: 'ranking', label: 'NIRF Ranking' },
    { value: 'dateAdded', label: 'Date Added' },
    { value: 'priority', label: 'Priority' }
  ];

  const locationOptions = [
    { value: 'delhi', label: 'Delhi' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'chennai', label: 'Chennai' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'pune', label: 'Pune' }
  ];

  const probabilityOptions = [
    { value: 'high', label: 'High (80%+)' },
    { value: 'medium', label: 'Medium (60-79%)' },
    { value: 'low', label: 'Low (<60%)' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const typeOptions = [
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private' },
    { value: 'deemed', label: 'Deemed University' }
  ];

  const activeFilterCount = Object.values(filters)?.filter(value => 
    value && (Array.isArray(value) ? value?.length > 0 : true)
  )?.length;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 mb-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Icon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="search"
              placeholder="Search bookmarked colleges..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="w-full lg:w-48">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={onSortChange}
            placeholder="Sort by"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          iconName="Filter"
          iconPosition="left"
          iconSize={16}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-primary-foreground text-primary text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div>
              <Select
                label="Location"
                options={locationOptions}
                value={filters?.location || []}
                onChange={(value) => onFiltersChange({ ...filters, location: value })}
                multiple
                placeholder="Any location"
              />
            </div>

            {/* Probability Filter */}
            <div>
              <Select
                label="Admission Probability"
                options={probabilityOptions}
                value={filters?.probability || []}
                onChange={(value) => onFiltersChange({ ...filters, probability: value })}
                multiple
                placeholder="Any probability"
              />
            </div>

            {/* Priority Filter */}
            <div>
              <Select
                label="Priority Level"
                options={priorityOptions}
                value={filters?.priority || []}
                onChange={(value) => onFiltersChange({ ...filters, priority: value })}
                multiple
                placeholder="Any priority"
              />
            </div>

            {/* College Type Filter */}
            <div>
              <Select
                label="College Type"
                options={typeOptions}
                value={filters?.type || []}
                onChange={(value) => onFiltersChange({ ...filters, type: value })}
                multiple
                placeholder="Any type"
              />
            </div>
          </div>

          {/* Fee Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Minimum Fees (₹)"
              type="number"
              placeholder="0"
              value={filters?.minFees || ''}
              onChange={(e) => onFiltersChange({ ...filters, minFees: e?.target?.value })}
            />
            <Input
              label="Maximum Fees (₹)"
              type="number"
              placeholder="No limit"
              value={filters?.maxFees || ''}
              onChange={(e) => onFiltersChange({ ...filters, maxFees: e?.target?.value })}
            />
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
            </span>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                disabled={activeFilterCount === 0}
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                Hide Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;