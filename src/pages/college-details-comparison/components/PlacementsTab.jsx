import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const PlacementsTab = ({ college }) => {
  const [selectedYear, setSelectedYear] = useState('2025');

  const years = ['2025', '2024', '2023', '2022'];
  const currentStats = college?.placementStats?.[selectedYear] || {};

  const sectorColors = ['#1E40AF', '#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#6B7280'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-foreground">{`${label}`}</p>
          <p className="text-primary">
            {`Package: ₹${payload?.[0]?.value}L`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="flex flex-wrap gap-2">
        {years?.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-lg transition-smooth ${
              selectedYear === year
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {currentStats?.placementRate}%
          </div>
          <div className="text-sm text-muted-foreground">Placement Rate</div>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            ₹{currentStats?.averagePackage}L
          </div>
          <div className="text-sm text-muted-foreground">Average Package</div>
        </div>
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-secondary mb-1">
            ₹{currentStats?.highestPackage}L
          </div>
          <div className="text-sm text-muted-foreground">Highest Package</div>
        </div>
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {currentStats?.companiesVisited}
          </div>
          <div className="text-sm text-muted-foreground">Companies Visited</div>
        </div>
      </div>
      {/* Branch-wise Placement Statistics */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Branch-wise Placement Statistics ({selectedYear})
        </h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentStats?.branchWise || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="branch" 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="averagePackage" 
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Sector-wise Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Sector-wise Placement Distribution
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentStats?.sectorWise || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="percentage"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {(currentStats?.sectorWise || [])?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={sectorColors?.[index % sectorColors?.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Package Distribution
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              {currentStats?.packageRanges?.map((range, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{range?.range}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${range?.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-12 text-right">
                      {range?.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Top Recruiters */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Top Recruiters ({selectedYear})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {college?.topRecruiters?.map((recruiter, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-card transition-smooth">
              <Image
                src={recruiter?.logo}
                alt={`${recruiter?.name} logo`}
                className="w-16 h-16 object-contain mx-auto mb-2"
              />
              <h4 className="font-medium text-sm text-foreground">{recruiter?.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{recruiter?.sector}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Placement Process */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Placement Process & Timeline
        </h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {college?.placementProcess?.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name={step?.icon} size={20} className="text-primary-foreground" />
                </div>
                <h4 className="font-heading font-medium text-sm text-foreground mb-2">
                  {step?.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-1">{step?.description}</p>
                <p className="text-xs font-medium text-primary">{step?.timeline}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Alumni Success Stories */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Alumni Success Stories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {college?.alumniStories?.map((story, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Image
                  src={story?.photo}
                  alt={story?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-heading font-medium text-foreground">{story?.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {story?.position} at {story?.company}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {story?.branch} • Batch of {story?.batch}
                  </p>
                  <p className="text-sm text-foreground italic">"{story?.quote}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Placement Support Services */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Placement Support Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {college?.placementSupport?.map((service, index) => (
            <div key={index} className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name={service?.icon} size={16} className="text-primary" />
                </div>
                <h4 className="font-heading font-medium text-foreground">{service?.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{service?.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlacementsTab;