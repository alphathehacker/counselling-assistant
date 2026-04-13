import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const PredictionSummary = ({ predictionData, isCollapsed, onToggle }) => {
  const { examType, rank, category, preferences, totalColleges, distribution } = predictionData;

  return (
    <div className="bg-card border border-border rounded-lg shadow-card mb-6">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Target" size={20} color="white" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground">
              Prediction Summary
            </h2>
            <p className="text-sm text-muted-foreground">
              {examType} • Rank: {rank} • Category: {category}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="font-mono font-semibold text-lg text-foreground">
              {totalColleges}
            </p>
            <p className="text-xs text-muted-foreground">Colleges Found</p>
          </div>
          <Icon 
            name={isCollapsed ? "ChevronDown" : "ChevronUp"} 
            size={20} 
            className="text-muted-foreground"
          />
        </div>
      </div>
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="font-medium text-sm text-success">High Chance</span>
              </div>
              <p className="font-mono font-semibold text-xl text-success mt-1">
                {distribution?.high}
              </p>
            </div>
            
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span className="font-medium text-sm text-warning">Moderate Chance</span>
              </div>
              <p className="font-mono font-semibold text-xl text-warning mt-1">
                {distribution?.moderate}
              </p>
            </div>
            
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-error rounded-full"></div>
                <span className="font-medium text-sm text-error">Low Chance</span>
              </div>
              <p className="font-mono font-semibold text-xl text-error mt-1">
                {distribution?.low}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="font-heading font-medium text-sm text-foreground mb-2">
              Your Preferences
            </h4>
            <div className="flex flex-wrap gap-2">
              {preferences?.map((pref, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionSummary;