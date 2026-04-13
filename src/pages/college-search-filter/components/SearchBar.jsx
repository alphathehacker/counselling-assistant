import React, { useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const SearchBar = ({ searchQuery, onSearchChange, onSearch, className = "" }) => {
  const searchRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e?.key === 'Enter') {
      e?.preventDefault();
      onSearch(searchQuery);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search colleges, courses, or locations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-12"
        />
        <Icon
          name="Search"
          size={20}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        />
        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange('');
              if (onSearch) onSearch('');
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;