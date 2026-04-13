import React from 'react';

const Switch = ({ checked, onChange, disabled = false, label = '', id }) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-center space-x-3">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <label
          htmlFor={switchId}
          className={`
            relative block w-10 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out
            ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span
            className={`
              absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out
              ${checked ? 'translate-x-4' : 'translate-x-0'}
            `}
          />
        </label>
      </div>
      {label && (
        <label htmlFor={switchId} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;
