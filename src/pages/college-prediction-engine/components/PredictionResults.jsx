import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const PredictionResults = ({ results, loading, onBookmark, onViewDetails, userRank, className = "" }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('cutoff');

  const sortOptions = [
    { value: 'cutoff', label: 'Closing Rank (Low to High)' },
    { value: 'name', label: 'College Name (A-Z)' },
    { value: 'district', label: 'District' },
  ];

  // Handle results format: can be object with {flat, grouped} or just an array
  const resultsData = results?.grouped ? results : { flat: results || [], grouped: [] };
  const flatResults = resultsData.flat || [];
  const groupedResults = resultsData.grouped || [];

  // Sort flat results
  const sortedResults = [...flatResults].sort((a, b) => {
    switch (sortBy) {
      case 'cutoff':
        return (a.closingRank || 999999) - (b.closingRank || 999999);
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'district':
        return (a.district || '').localeCompare(b.district || '');
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="font-medium text-foreground">Generating Predictions</p>
              <p className="text-sm text-muted-foreground">
                Analyzing your profile and matching with colleges...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((!results || (Array.isArray(results) && results.length === 0)) && (!groupedResults || groupedResults.length === 0)) {
    return (
      <div className={`bg-card border border-border rounded-lg p-8 text-center ${className}`}>
        <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="font-heading font-medium text-lg text-foreground mb-2">
          No Predictions Generated
        </h3>
        <p className="text-muted-foreground">
          Fill in your details and click "Generate Predictions" to see college recommendations.
        </p>
      </div>
    );
  }

  // Use grouped results if available, otherwise use flat results
  const displayGrouped = groupedResults.length > 0;

  return (
    <div className={className}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading font-semibold text-xl text-foreground">
            Predicted Colleges
          </h2>
          <p className="text-sm text-muted-foreground">
            {displayGrouped 
              ? groupedResults.reduce((sum, group) => sum + (group.colleges?.length || 0), 0)
              : sortedResults.length} colleges found based on your rank
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Sort by"
            className="w-48"
          />
          {((displayGrouped && groupedResults.length > 0) || sortedResults.length > 0) && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  // Store results in sessionStorage to pass to explore page
                  const resultsToStore = {
                    flat: sortedResults,
                    grouped: groupedResults,
                  };
                  sessionStorage.setItem('predictionResults', JSON.stringify(resultsToStore));
                  // Store user rank if available
                  if (userRank) {
                    sessionStorage.setItem('userRank', userRank.toString());
                  }
                  navigate('/explore-colleges');
                }}
                iconName="Grid3x3"
                iconPosition="left"
              >
                Explore Colleges
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  // Get prediction params from parent component
                  const params = JSON.parse(sessionStorage.getItem('predictionParams') || '{}');
                  
                  // Generate a unique ID for this prediction session
                  const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  
                  // Store prediction data in sessionStorage for the results page
                  const resultsToStore = {
                    flat: sortedResults,
                    grouped: groupedResults,
                  };
                  sessionStorage.setItem('predictionResults', JSON.stringify(resultsToStore));
                  sessionStorage.setItem('predictionParams', JSON.stringify(params));
                  sessionStorage.setItem('currentPredictionId', predictionId);
                  
                  // Navigate with ID in URL
                  navigate(`/prediction-results-reports?id=${predictionId}`, { 
                    state: { predictionParams: params } 
                  });
                }}
                iconName="FileText"
                iconPosition="left"
              >
                View Detailed Results
              </Button>
            </>
          )}
        </div>
              </div>

      {/* Results - Grouped by District and Branch */}
      {displayGrouped ? (
        <div className="space-y-6">
          {groupedResults.map((group, groupIndex) => (
            <div key={`${group.district}_${group.branch}_${groupIndex}`} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  {group.branch} in {group.district}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        College Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        District
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                        Closing Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {group.colleges?.map((college, index) => {
                      const collegeName = college?.name || college?.college_name || 'N/A';
                      const closing =
                        college?.closingRank ??
                        college?.cutoffRank ??
                        college?.cutoff_rank ??
                        null;

                      return (
                      <tr
                        key={`${group.district}_${group.branch}_${index}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="font-medium">{collegeName}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground uppercase">
                          {college?.branch || group.branch || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground uppercase">
                          {college?.district || group.district || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground uppercase">
                          {college?.gender || 'COED'}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-medium text-foreground text-right">
                          {closing
                            ? Number(closing).toLocaleString('en-IN')
                            : 'N/A'}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback to flat table if no grouped results */
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    College Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Closing Rank
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {sortedResults.map((college, index) => (
                  <tr
                    key={college?.id || index}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="font-medium">{college?.name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground uppercase">
                      {college?.branch || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground uppercase">
                      {college?.district || college?.location?.district || college?.location?.city || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground uppercase">
                      {college?.gender || 'COED'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium text-foreground text-right">
                      {college?.closingRank 
                        ? college.closingRank.toLocaleString('en-IN') 
                        : college?.cutoffRank 
                          ? college.cutoffRank.toLocaleString('en-IN') 
                          : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedResults.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="Search" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No colleges found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionResults;