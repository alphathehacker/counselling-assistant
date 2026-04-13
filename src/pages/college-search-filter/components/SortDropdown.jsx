import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SortDropdown = ({ sortBy, onSortChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { value: 'relevance', label: 'Relevance', icon: 'Star' },
    { value: 'ranking', label: 'NIRF Ranking', icon: 'Trophy' },
    { value: 'fees-low', label: 'Fees: Low to High', icon: 'TrendingUp' },
    { value: 'fees-high', label: 'Fees: High to Low', icon: 'TrendingDown' },
    { value: 'cutoff-low', label: 'Cutoff: Low to High', icon: 'Target' },
    { value: 'cutoff-high', label: 'Cutoff: High to Low', icon: 'Target' },
    { value: 'alphabetical', label: 'Alphabetical', icon: 'SortAsc' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = sortOptions?.find(option => option?.value === sortBy) || sortOptions?.[0];

  const handleOptionClick = (option) => {
    onSortChange(option?.value);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-smooth"
      >
        <Icon name={selectedOption?.icon} size={16} />
        <span>Sort: {selectedOption?.label}</span>
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-modal z-300 py-1">
          {sortOptions?.map((option) => (
            <button
              key={option?.value}
              onClick={() => handleOptionClick(option)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-muted transition-smooth ${
                sortBy === option?.value ? 'bg-muted text-primary' : 'text-foreground'
              }`}
            >
              <Icon name={option?.icon} size={16} />
              <span className="text-sm">{option?.label}</span>
              {sortBy === option?.value && (
                <Icon name="Check" size={16} className="ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;