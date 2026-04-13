import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const CutoffsTab = ({ college }) => {
  const [selectedExam, setSelectedExam] = useState('jee-main');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [viewType, setViewType] = useState('trend');

  const examOptions = [
    { value: 'jee-main', label: 'JEE Main' },
    { value: 'jee-advanced', label: 'JEE Advanced' },
    { value: 'eapcet', label: 'EAPCET' },
    { value: 'comedk', label: 'COMEDK' }
  ];

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'obc', label: 'OBC-NCL' },
    { value: 'sc', label: 'SC' },
    { value: 'st', label: 'ST' },
    { value: 'ews', label: 'EWS' }
  ];

  const currentCutoffs = college?.cutoffs?.[selectedExam]?.[selectedCategory] || [];
  const trendData = college?.cutoffTrends?.[selectedExam]?.[selectedCategory] || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-foreground">{`Year: ${label}`}</p>
          <p className="text-primary">
            {`Cutoff Rank: ${payload?.[0]?.value?.toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-muted rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Select Exam"
            options={examOptions}
            value={selectedExam}
            onChange={setSelectedExam}
          />
          <Select
            label="Select Category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <div className="flex items-end space-x-2">
            <Button
              variant={viewType === 'trend' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('trend')}
              iconName="TrendingUp"
              iconPosition="left"
            >
              Trend View
            </Button>
            <Button
              variant={viewType === 'branches' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('branches')}
              iconName="BarChart3"
              iconPosition="left"
            >
              Branch Wise
            </Button>
          </div>
        </div>
      </div>
      {/* Current Year Cutoffs */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          {selectedExam?.toUpperCase()} Cutoffs 2025 - {selectedCategory?.toUpperCase()}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCutoffs?.map((cutoff, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-heading font-medium text-foreground">{cutoff?.branch}</h4>
                <span className="text-xs text-muted-foreground">{cutoff?.code}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Opening Rank:</span>
                  <span className="font-mono font-semibold text-success">
                    {cutoff?.openingRank?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Closing Rank:</span>
                  <span className="font-mono font-semibold text-error">
                    {cutoff?.closingRank?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Seats:</span>
                  <span className="font-mono font-medium text-foreground">
                    {cutoff?.totalSeats}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Visualization */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          {viewType === 'trend' ? 'Cutoff Trends' : 'Branch-wise Comparison'}
        </h3>
        <div className="bg-card border border-border rounded-lg p-4">
          {viewType === 'trend' ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="year" 
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) => value?.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="cutoffRank" 
                    stroke="var(--color-primary)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'var(--color-primary)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentCutoffs?.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="code" 
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) => value?.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value?.toLocaleString(), 'Closing Rank']}
                    labelFormatter={(label) => `Branch: ${label}`}
                  />
                  <Bar 
                    dataKey="closingRank" 
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      {/* Cutoff Analysis */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Cutoff Analysis & Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading font-medium text-foreground mb-3 flex items-center space-x-2">
              <Icon name="TrendingUp" size={20} className="text-success" />
              <span>Trend Analysis</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <Icon name="ArrowUp" size={16} className="text-error mt-0.5 flex-shrink-0" />
                <span>Cutoffs have increased by 15% compared to last year</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="ArrowDown" size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>Computer Science shows highest competition</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="Minus" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>Civil Engineering has most stable cutoffs</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading font-medium text-foreground mb-3 flex items-center space-x-2">
              <Icon name="Target" size={20} className="text-primary" />
              <span>Admission Tips</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <Icon name="Check" size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>Apply for multiple branches to increase chances</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="Check" size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>Consider branch sliding options</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="Check" size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>Keep backup colleges ready</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CutoffsTab;