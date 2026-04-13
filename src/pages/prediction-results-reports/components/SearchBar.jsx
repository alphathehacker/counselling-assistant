import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

import Button from '../../../components/ui/Button';

const SearchBar = ({ onSearch, onFilterToggle, placeholder = "Search colleges..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    onSearch(debouncedTerm);
  }, [debouncedTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    setDebouncedTerm('');
  };

  return (
    <div className="flex items-center space-x-3 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name="Search" size={20} className="text-muted-foreground" />
        </div>
        
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
          className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground placeholder-muted-foreground"
        />
        
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            <Icon name="X" size={20} />
          </button>
        )}
      </div>
      <Button
        variant="outline"
        onClick={onFilterToggle}
        iconName="Filter"
        iconPosition="left"
        className="lg:hidden"
      >
        Filters
      </Button>
    </div>
  );
};

export default SearchBar;