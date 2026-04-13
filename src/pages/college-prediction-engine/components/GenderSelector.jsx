import React from 'react';
import Icon from '../../../components/AppIcon';

const GENDER_OPTIONS = [
  {
    value: 'Gender-Neutral',
    label: 'Gender-Neutral',
    description: 'Open to all genders',
    icon: 'Users',
  },
  {
    value: 'Female-only',
    label: 'Female-only',
    description: 'Female-only seats (incl. Supernumerary)',
    icon: 'User',
  },
  {
    value: 'All',
    label: 'All Seats',
    description: 'Show both Gender-Neutral and Female-only',
    icon: 'UsersRound',
  },
];

const GenderSelector = ({ selectedGender, onGenderChange, className = '' }) => {
  const current = selectedGender || 'Gender-Neutral';

  return (
    <div className={className}>
      <label className="block font-heading font-medium text-sm text-foreground mb-1">
        Seat Type (Gender)
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        JEE Main seats are split into Gender-Neutral and Female-only pools
      </p>
      <div className="grid grid-cols-1 gap-2">
        {GENDER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onGenderChange(option.value)}
            className={`flex items-center space-x-3 p-3 rounded-lg border text-left transition-all ${
              current === option.value
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                current === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <Icon name={option.icon} size={14} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm leading-tight">{option.label}</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                {option.description}
              </div>
            </div>
            {current === option.value && (
              <Icon name="Check" size={14} className="text-primary ml-auto flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenderSelector;
