import React from 'react';

const LoadingGrid = ({ count = 6, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count })?.map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-lg shadow-card overflow-hidden animate-pulse">
          {/* Image Skeleton */}
          <div className="h-48 bg-muted"></div>
          
          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-5 bg-muted rounded w-3/4"></div>
            
            {/* Location */}
            <div className="h-4 bg-muted rounded w-1/2"></div>
            
            {/* Type and Year */}
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
            
            {/* Fees */}
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
            
            {/* Branches */}
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
                <div className="h-6 bg-muted rounded w-14"></div>
              </div>
            </div>
            
            {/* Cutoff and Probability */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex space-x-2 pt-2">
              <div className="h-8 bg-muted rounded flex-1"></div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingGrid;