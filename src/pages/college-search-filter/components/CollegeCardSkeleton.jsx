import React from 'react';

const CollegeCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative h-48 bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        
        {/* Type and year skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
        
        {/* Fees skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-5 bg-muted rounded w-20" />
        </div>
        
        {/* Branches skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-28" />
          <div className="flex space-x-2">
            <div className="h-6 bg-muted rounded w-16" />
            <div className="h-6 bg-muted rounded w-20" />
            <div className="h-6 bg-muted rounded w-14" />
          </div>
        </div>
        
        {/* Cutoff and probability skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-muted rounded w-28" />
            <div className="h-5 bg-muted rounded w-12" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-6 bg-muted rounded w-20" />
          </div>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex space-x-2 pt-2">
          <div className="h-10 bg-muted rounded flex-1" />
          <div className="h-10 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  );
};

export default CollegeCardSkeleton;
