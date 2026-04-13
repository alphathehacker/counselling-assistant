import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionCards = () => {
  const quickActions = [
    {
      id: 1,
      title: 'New Prediction',
      description: 'Get personalized college recommendations',
      icon: 'Target',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      route: '/college-prediction-engine',
      buttonText: 'Start Prediction',
      buttonVariant: 'default'
    },
    {
      id: 2,
      title: 'View Results',
      description: 'Check your saved prediction reports',
      icon: 'BarChart3',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      route: '/bookmarks-saved-colleges',
      buttonText: 'View Results',
      buttonVariant: 'default'
    },
    {
      id: 3,
      title: 'Search Colleges',
      description: 'Explore colleges with advanced filters',
      icon: 'Search',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      route: '/college-search-filter',
      buttonText: 'Search Now',
      buttonVariant: 'default'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions?.map((action) => (
        <div
          key={action?.id}
          className={`${action?.bgColor} ${action?.borderColor} border rounded-xl p-6 hover:shadow-modal transition-smooth`}
        >
          <div className={`w-12 h-12 ${action?.bgColor} rounded-lg flex items-center justify-center mb-4`}>
            <Icon name={action?.icon} size={24} className={action?.iconColor} />
          </div>
          
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
            {action?.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {action?.description}
          </p>
          
          <Link to={action?.route}>
            <Button
              variant={action?.buttonVariant}
              size="sm"
              fullWidth
              iconName="ArrowRight"
              iconPosition="right"
            >
              {action?.buttonText}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default QuickActionCards;