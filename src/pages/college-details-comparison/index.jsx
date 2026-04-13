import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { predictionAPI } from '../../utils/api';

import ComparisonView from './components/ComparisonView';

const CollegeDetailsComparison = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [comparisonColleges, setComparisonColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [navSource, setNavSource] = useState(null);

  useEffect(() => {
    const loadCollegeData = async () => {
      try {
        let collegesFromState = location.state?.colleges;
        let source = location.state?.source;

        if (!collegesFromState) {
          const searchKey = 'comparisonColleges_search';
          const predictionKey = 'comparisonColleges_prediction';
          const bookmarksKey = 'comparisonColleges_bookmarks';
          
          const searchColleges = sessionStorage.getItem(searchKey);
          const predictionColleges = sessionStorage.getItem(predictionKey);
          const bookmarksColleges = sessionStorage.getItem(bookmarksKey);
          
          // Try to get from all sources and use whichever has colleges
          if (searchColleges) {
            const parsedSearch = JSON.parse(searchColleges);
            if (parsedSearch && parsedSearch.length > 0) {
              collegesFromState = parsedSearch;
              source = source || 'search';
            }
          }
          if (!collegesFromState && predictionColleges) {
            const parsedPrediction = JSON.parse(predictionColleges);
            if (parsedPrediction && parsedPrediction.length > 0) {
              collegesFromState = parsedPrediction;
              source = source || 'prediction';
            }
          }
          if (!collegesFromState && bookmarksColleges) {
            const parsedBookmarks = JSON.parse(bookmarksColleges);
            if (parsedBookmarks && parsedBookmarks.length > 0) {
              collegesFromState = parsedBookmarks;
              source = 'bookmarks';
            }
          }
        }

        if (!collegesFromState || collegesFromState.length === 0) {
          setError('No colleges selected for comparison');
          return;
        }

        setNavSource(source || 'search');
        setLoading(true);
        setError(null);

        // Bookmarks come from prediction results / localStorage - backend API doesn't have these colleges.
        // Use passed data directly instead of fetching (avoids 404s and preserves predictionData).
        if (source === 'bookmarks') {
          setComparisonColleges(collegesFromState);
          setLoading(false);
          return;
        }

        const collegePromises = collegesFromState.map(async (college) => {
          try {
            if (college._id || college.id) {
              const response = await predictionAPI.getCollegeById(college._id || college.id);
              if (response.data.success && response.data.college) {
                return response.data.college;
              }
            }
            return college;
          } catch (err) {
            return college; // Use passed data when API fails
          }
        });

        const detailedColleges = await Promise.all(collegePromises);
        setComparisonColleges(detailedColleges);
      } catch (error) {
        console.error('Error loading college comparison data:', error);
        setError('Failed to load college data for comparison');
      } finally {
        setLoading(false);
      }
    };

    loadCollegeData();
  }, [location.state]);

  const handleCloseComparison = () => {
    const source = navSource || location.state?.source;
    navigate(source === 'bookmarks' ? '/bookmarks-saved-colleges' : '/college-search-filter');
  };

  const handleRemoveFromComparison = (collegeId) => {
    const updatedColleges = comparisonColleges?.filter(college => 
      (college?._id || college?.id) !== collegeId
    );
    setComparisonColleges(updatedColleges);
    
    if (updatedColleges.length === 0) {
      const source = navSource || location.state?.source;
      navigate(source === 'bookmarks' ? '/bookmarks-saved-colleges' : '/college-search-filter');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-16 pb-20 md:pb-6">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Loading college comparison...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-16 pb-20 md:pb-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                Error Loading Comparison
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleCloseComparison}>
                {navSource === 'bookmarks' ? 'Back to Bookmarks' : 'Back to College Search'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (comparisonColleges.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-16 pb-20 md:pb-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Icon name="GitCompare" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                No Colleges Selected
              </h3>
              <p className="text-muted-foreground mb-4">
                Please select colleges to compare
              </p>
              <Button onClick={handleCloseComparison}>
                {navSource === 'bookmarks' ? 'Back to Bookmarks' : 'Back to College Search'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ComparisonView
      colleges={comparisonColleges}
      onClose={handleCloseComparison}
      onRemoveCollege={handleRemoveFromComparison}
    />
  );
};

export default CollegeDetailsComparison;