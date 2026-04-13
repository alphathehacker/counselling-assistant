import React from 'react';
import Icon from '../../../components/AppIcon';

const TabNavigation = ({ activeTab, onTabChange, className = "" }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'Info' },
    { id: 'courses', label: 'Courses', icon: 'BookOpen' },
    { id: 'cutoffs', label: 'Cutoffs', icon: 'TrendingUp' },
    { id: 'fees', label: 'Fees', icon: 'DollarSign' },
    { id: 'placements', label: 'Placements', icon: 'Briefcase' },
    { id: 'reviews', label: 'Reviews', icon: 'Star' }
  ];

  return (
    <div className={`bg-card border-b border-border ${className}`}>
      {/* Mobile Tab Navigation */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => onTabChange(tab?.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth mr-2 ${
                activeTab === tab?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Desktop Tab Navigation */}
      <div className="hidden md:flex">
        <nav className="flex space-x-8 px-6">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => onTabChange(tab?.id)}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-smooth ${
                activeTab === tab?.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span className="font-medium text-sm">{tab?.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;