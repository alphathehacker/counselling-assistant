import React from 'react';
import Icon from '../../../components/AppIcon';

const FilterChips = ({ activeFilters, onRemoveFilter, onClearAll, className = "" }) => {
  const getFilterChips = () => {
    const chips = [];

    // Location chips
    if (activeFilters?.location && activeFilters?.location?.length > 0) {
      activeFilters?.location?.forEach(location => {
        chips?.push({
          key: `location-${location}`,
          label: location?.charAt(0)?.toUpperCase() + location?.slice(1),
          type: 'location',
          value: location,
          icon: 'MapPin'
        });
      });
    }

    // College type chips
    if (activeFilters?.collegeType && activeFilters?.collegeType?.length > 0) {
      activeFilters?.collegeType?.forEach(type => {
        chips?.push({
          key: `type-${type}`,
          label: type?.charAt(0)?.toUpperCase() + type?.slice(1),
          type: 'collegeType',
          value: type,
          icon: 'Building'
        });
      });
    }

    // Course chips
    if (activeFilters?.course && activeFilters?.course?.length > 0) {
      activeFilters?.course?.forEach(course => {
        const courseLabels = {
          'cse': 'Computer Science',
          'ece': 'Electronics & Communication',
          'me': 'Mechanical',
          'ce': 'Civil',
          'ee': 'Electrical',
          'it': 'Information Technology'
        };
        chips?.push({
          key: `course-${course}`,
          label: courseLabels?.[course] || course,
          type: 'course',
          value: course,
          icon: 'BookOpen'
        });
      });
    }

    // Fees range chip
    if (activeFilters?.feesMin || activeFilters?.feesMax) {
      const min = activeFilters?.feesMin ? `₹${parseInt(activeFilters?.feesMin)?.toLocaleString()}` : '₹0';
      const max = activeFilters?.feesMax ? `₹${parseInt(activeFilters?.feesMax)?.toLocaleString()}` : '∞';
      chips?.push({
        key: 'fees-range',
        label: `Fees: ${min} - ${max}`,
        type: 'fees',
        icon: 'DollarSign'
      });
    }

    // Ranking range chip
    if (activeFilters?.rankingMin || activeFilters?.rankingMax) {
      const min = activeFilters?.rankingMin || '1';
      const max = activeFilters?.rankingMax || '∞';
      chips?.push({
        key: 'ranking-range',
        label: `Rank: ${min} - ${max}`,
        type: 'ranking',
        icon: 'Trophy'
      });
    }

    // Cutoff range chip
    if (activeFilters?.cutoffMin || activeFilters?.cutoffMax) {
      const min = activeFilters?.cutoffMin || '1';
      const max = activeFilters?.cutoffMax || '∞';
      chips?.push({
        key: 'cutoff-range',
        label: `Cutoff: ${min} - ${max}`,
        type: 'cutoff',
        icon: 'Target'
      });
    }

    // Package range chip
    if (activeFilters?.packageMin || activeFilters?.packageMax) {
      const min = activeFilters?.packageMin ? `${activeFilters?.packageMin}L` : '0L';
      const max = activeFilters?.packageMax ? `${activeFilters?.packageMax}L` : '∞';
      chips?.push({
        key: 'package-range',
        label: `Package: ${min} - ${max}`,
        type: 'package',
        icon: 'Briefcase'
      });
    }

    return chips;
  };

  const handleRemoveChip = (chip) => {
    if (chip?.type === 'location') {
      const updatedLocations = activeFilters?.location?.filter(loc => loc !== chip?.value);
      onRemoveFilter('location', updatedLocations);
    } else if (chip?.type === 'collegeType') {
      const updatedTypes = activeFilters?.collegeType?.filter(type => type !== chip?.value);
      onRemoveFilter('collegeType', updatedTypes);
    } else if (chip?.type === 'course') {
      const updatedCourses = activeFilters?.course?.filter(course => course !== chip?.value);
      onRemoveFilter('course', updatedCourses);
    } else if (chip?.type === 'fees') {
      onRemoveFilter('feesMin', '');
      onRemoveFilter('feesMax', '');
    } else if (chip?.type === 'ranking') {
      onRemoveFilter('rankingMin', '');
      onRemoveFilter('rankingMax', '');
    } else if (chip?.type === 'cutoff') {
      onRemoveFilter('cutoffMin', '');
      onRemoveFilter('cutoffMax', '');
    } else if (chip?.type === 'package') {
      onRemoveFilter('packageMin', '');
      onRemoveFilter('packageMax', '');
    }
  };

  const chips = getFilterChips();

  if (chips?.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips?.map((chip) => (
        <div
          key={chip?.key}
          className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm"
        >
          <Icon name={chip?.icon} size={14} />
          <span className="font-medium">{chip?.label}</span>
          <button
            onClick={() => handleRemoveChip(chip)}
            className="hover:bg-primary/20 rounded-full p-0.5 transition-smooth"
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      ))}
      {chips?.length > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center space-x-1 px-3 py-1.5 text-muted-foreground hover:text-foreground border border-border rounded-full text-sm transition-smooth"
        >
          <Icon name="X" size={14} />
          <span>Clear All</span>
        </button>
      )}
    </div>
  );
};

export default FilterChips;