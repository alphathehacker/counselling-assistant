import React from 'react';
import CollegeCard from './CollegeCard';

const ResultsGrid = ({ 
  colleges, 
  selectedColleges, 
  onCollegeSelect, 
  onBookmark, 
  onViewDetails,
  loading 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)]?.map((_, index) => (
          <div key={index} className="bg-card border border-border rounded-lg shadow-card animate-pulse">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="w-20 h-6 bg-muted rounded-full"></div>
                </div>
                <div className="w-6 h-6 bg-muted rounded"></div>
              </div>
              
              <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
              
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-muted rounded"></div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {[...Array(3)]?.map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="w-1/3 h-3 bg-muted rounded"></div>
                    <div className="w-1/4 h-3 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[...Array(3)]?.map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="w-full h-3 bg-muted rounded mb-1"></div>
                    <div className="w-3/4 h-4 bg-muted rounded mx-auto"></div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1 h-8 bg-muted rounded"></div>
                <div className="flex-1 h-8 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (colleges?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 1112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
          No colleges found
        </h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your filters or search criteria to find more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {colleges?.map((college, index) => {
        const collegeId = college?._id || college?.id;
        // Create a unique key using multiple fields to avoid duplicates
        const uniqueKey = collegeId ? `${collegeId}-${index}` : `${college?.name || 'unknown'}-${index}`;
        return (
          <CollegeCard
            key={uniqueKey}
            college={college}
            isSelected={selectedColleges?.includes(collegeId)}
            onSelect={onCollegeSelect}
            onBookmark={onBookmark}
            onViewDetails={onViewDetails}
          />
        );
      })}
    </div>
  );
};

export default ResultsGrid;