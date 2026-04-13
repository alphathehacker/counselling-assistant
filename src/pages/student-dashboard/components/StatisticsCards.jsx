import React from 'react';
import Icon from '../../../components/AppIcon';

const StatisticsCards = ({ stats }) => {
  const statisticsData = [
    {
      id: 1,
      title: 'Total Predictions',
      value: stats?.totalPredictions || 0,
      icon: 'Target',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'increase'
    },
    {
      id: 2,
      title: 'Colleges Bookmarked',
      value: stats?.bookmarkedColleges || 0,
      icon: 'Bookmark',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'increase'
    },
    {
      id: 3,
      title: 'Reports Downloaded',
      value: stats?.reportsDownloaded || 0,
      icon: 'Download',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+25%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {statisticsData?.map((stat) => (
        <div
          key={stat?.id}
          className="bg-card rounded-xl p-4 border border-border shadow-card hover:shadow-modal transition-smooth"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${stat?.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon name={stat?.icon} size={20} className={stat?.color} />
            </div>
            <div className={`flex items-center space-x-1 text-xs ${
              stat?.changeType === 'increase' ? 'text-success' : 'text-error'
            }`}>
              <Icon 
                name={stat?.changeType === 'increase' ? 'TrendingUp' : 'TrendingDown'} 
                size={12} 
              />
              <span>{stat?.change}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-mono font-semibold text-2xl text-foreground mb-1">
              {stat?.value?.toLocaleString()}
            </h4>
            <p className="text-muted-foreground text-sm font-medium">
              {stat?.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards;