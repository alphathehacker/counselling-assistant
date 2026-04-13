import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsSummary = ({ stats }) => {
  const { totalColleges, averageFees, distribution, averagePackage } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Building2" size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Colleges</p>
            <p className="font-mono font-semibold text-xl text-foreground">
              {totalColleges}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="TrendingUp" size={20} className="text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High Probability</p>
            <p className="font-mono font-semibold text-xl text-success">
              {distribution?.high}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon name="DollarSign" size={20} className="text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Fees</p>
            <p className="font-mono font-semibold text-xl text-foreground">
              ₹{(averageFees / 100000)?.toFixed(1)}L
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Icon name="Briefcase" size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Package</p>
            <p className="font-mono font-semibold text-xl text-foreground">
              ₹{(averagePackage / 100000)?.toFixed(1)}L
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;