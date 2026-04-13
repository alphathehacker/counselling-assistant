import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { Checkbox } from './Checkbox';

const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  filterConfig = {},
  className = ""
}) => {
  const [localFilters, setLocalFilters] = useState(filters || {});

  const defaultConfig = {
    showLocation: true,
    showCollegeType: true,
    showCourse: true,
    showFees: true,
    showRanking: true,
    showCutoff: true,
    showPlacements: true,
    showExamType: true,
    ...filterConfig
  };

  // Use states (matches backend location.state) - cities like Mumbai are in Maharashtra
  const locationOptions = [
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Kerala', label: 'Kerala' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Odisha', label: 'Odisha' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Jharkhand', label: 'Jharkhand' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  ];

  const collegeTypeOptions = [
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private' },
    { value: 'deemed', label: 'Deemed University' },
    { value: 'autonomous', label: 'Autonomous' }
  ];

  const examTypeOptions = [
    { value: 'AP EAPCET', label: 'AP EAPCET / AP ECET' },
    { value: 'NEET', label: 'NEET' },
    { value: 'JEE Main', label: 'JEE Main' },
    { value: 'JEE Advanced', label: 'JEE Advanced' }
  ];

  const courseOptions = [
    { value: 'cse', label: 'Computer Science Engineering' },
    { value: 'ece', label: 'Electronics & Communication' },
    { value: 'me', label: 'Mechanical Engineering' },
    { value: 'ce', label: 'Civil Engineering' },
    { value: 'ee', label: 'Electrical Engineering' },
    { value: 'it', label: 'Information Technology' }
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
    <div className={`bg-card border-r border-border h-full overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="font-heading font-semibold text-lg text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
          >
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Location Filter */}
        {defaultConfig?.showLocation && (
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
        )}

        {/* Exam Type Filter */}
        {defaultConfig?.showExamType && (
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-3">
              Exam Type
            </label>
            <Select
              options={examTypeOptions}
              value={localFilters?.examType || ''}
              onChange={(value) => handleFilterChange('examType', value)}
              placeholder="Select exam type"
            />
          </div>
        )}

        {/* College Type Filter */}
        {defaultConfig?.showCollegeType && (
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
        )}

        {/* Course Filter */}
        {defaultConfig?.showCourse && (
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-3">
              Course
            </label>
            <Select
              options={courseOptions}
              value={localFilters?.course || []}
              onChange={(value) => handleFilterChange('course', value)}
              multiple
              searchable
              placeholder="Select courses"
            />
          </div>
        )}

        {/* Fees Range Filter */}
        {defaultConfig?.showFees && (
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-3">
              Annual Fees Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min (₹)"
                value={localFilters?.feesMin || ''}
                onChange={(e) => handleFilterChange('feesMin', e?.target?.value)}
              />
              <Input
                type="number"
                placeholder="Max (₹)"
                value={localFilters?.feesMax || ''}
                onChange={(e) => handleFilterChange('feesMax', e?.target?.value)}
              />
            </div>
          </div>
        )}

        {/* NIRF Ranking Filter */}
        {defaultConfig?.showRanking && (
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
        )}

        {/* Cutoff Range Filter */}
        {defaultConfig?.showCutoff && (
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-3">
              JEE Main Cutoff Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min rank"
                value={localFilters?.cutoffMin || ''}
                onChange={(e) => handleFilterChange('cutoffMin', e?.target?.value)}
              />
              <Input
                type="number"
                placeholder="Max rank"
                value={localFilters?.cutoffMax || ''}
                onChange={(e) => handleFilterChange('cutoffMax', e?.target?.value)}
              />
            </div>
          </div>
        )}

        {/* Placement Package Filter */}
        {defaultConfig?.showPlacements && (
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
        )}
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

    return createPortal(
      <div className="fixed inset-0 z-250 lg:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-card rounded-t-lg animate-slide-up">
          {panelContent}
        </div>
      </div>,
      document.body
    );
  }

  // Desktop: Render as sidebar
  if (!isOpen) return null;

  return (
    <div className="hidden lg:block w-80 flex-shrink-0">
      {panelContent}
    </div>
  );
};

export default FilterPanel;