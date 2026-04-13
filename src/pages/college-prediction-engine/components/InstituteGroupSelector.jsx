import React from 'react';
import Icon from '../../../components/AppIcon';

const INSTITUTE_GROUPS = [
  {
    value: 'NIT',
    label: 'NITs',
    description: 'National Institutes of Technology',
    icon: 'Building2',
  },
  {
    value: 'IIIT',
    label: 'IIITs',
    description: 'Indian Institutes of Information Technology',
    icon: 'Cpu',
  },
  {
    value: 'GFTI',
    label: 'GFTIs',
    description: 'Government Funded Technical Institutes',
    icon: 'School',
  },
];

const InstituteGroupSelector = ({ selectedGroups, onGroupChange, className = '' }) => {
  const selected = Array.isArray(selectedGroups) ? selectedGroups : [];

  const toggle = (value) => {
    if (selected.includes(value)) {
      onGroupChange(selected.filter((v) => v !== value));
    } else {
      onGroupChange([...selected, value]);
    }
  };

  return (
    <div className={className}>
      <label className="block font-heading font-medium text-sm text-foreground mb-1">
        Institute Type
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Filter by institute category (select multiple or leave blank for all)
      </p>
      <div className="grid grid-cols-1 gap-2">
        {INSTITUTE_GROUPS.map((group) => {
          const isSelected = selected.includes(group.value);
          return (
            <button
              key={group.value}
              type="button"
              onClick={() => toggle(group.value)}
              className={`flex items-center space-x-3 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <Icon name={group.icon} size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm leading-tight">{group.label}</div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {group.description}
                </div>
              </div>
              {isSelected && (
                <Icon name="Check" size={14} className="text-primary flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onGroupChange([])}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1"
        >
          <Icon name="X" size={12} />
          <span>Clear selection (show all types)</span>
        </button>
      )}
    </div>
  );
};

export default InstituteGroupSelector;
