import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import CollegeCard from './components/CollegeCard';
import CollegeDetailsModal from '../../components/ui/CollegeDetailsModal';
import { predictionAPI } from '../../utils/api';
import { getCollegeImageUrl } from '../../utils/collegeImageService';

const ExploreColleges = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('cutoff');
  const [filterBy, setFilterBy] = useState('all');
  const [bookmarkedColleges, setBookmarkedColleges] = useState(new Set());
  const [collegeDetailsModal, setCollegeDetailsModal] = useState({ open: false, college: null });

  useEffect(() => {
    loadColleges();
  }, []);

  const loadColleges = async () => {
    try {
      setLoading(true);
      
      // Get prediction results from sessionStorage
      const storedResults = sessionStorage.getItem('predictionResults');
      if (!storedResults) {
        // If no results, redirect back to prediction engine
        navigate('/college-prediction-engine');
        return;
      }

      const results = JSON.parse(storedResults);
      const flatResults = results.flat || [];
      
      // Fetch full college details from database
      const collegeNames = [...new Set(flatResults.map(r => r.name).filter(Boolean))];
      
      if (collegeNames.length === 0) {
        setColleges([]);
        setLoading(false);
        return;
      }

      // Get user's rank from sessionStorage if available
      const userRank = parseInt(sessionStorage.getItem('userRank')) || null;
      
      // Fetch full college details from database if available
      let collegeDetailsMap = {};
      try {
        if (collegeNames.length > 0) {
          const detailsResponse = await predictionAPI.post('/colleges/details', {
            collegeNames: collegeNames,
          });
          if (detailsResponse.data.success) {
            collegeDetailsMap = detailsResponse.data.colleges || {};
          }
        }
      } catch (error) {
        console.warn('Could not fetch college details from database:', error);
        // Continue with prediction results data
      }
      
      // Enhance prediction results with full college details and images
      const enhancedColleges = await Promise.all(
        flatResults.map(async (result, index) => {
          const cutoffRank = result.closingRank || result.cutoffRank;
          
          // Get full college details from database if available
          const dbCollege = collegeDetailsMap[result.name] || null;
          
          // Calculate probability based on rank vs cutoff
          let probability = 'high';
          if (userRank && cutoffRank) {
            const ratio = userRank / cutoffRank;
            if (ratio <= 0.5) {
              probability = 'high';
            } else if (ratio <= 0.75) {
              probability = 'good';
            } else if (ratio <= 1.0) {
              probability = 'moderate';
            } else {
              probability = 'low';
            }
          }
          
          // Get location string
          const location = dbCollege?.location?.city && dbCollege?.location?.state
            ? `${dbCollege.location.city}, ${dbCollege.location.state}`
            : result.location?.city && result.location?.state
            ? `${result.location.city}, ${result.location.state}`
            : result.district || 'N/A';
          
          // Fetch college image from web
          const imageUrl = await getCollegeImageUrl(result.name, location);
          
          // Get all available branches from database or prediction result
          const availableBranches = dbCollege?.branches?.map(b => b.name) || 
                                   result.availableBranches || 
                                   [result.branch].filter(Boolean);
          
          return {
            id: result.id || index + 1,
            name: result.name,
            location: location,
            type: dbCollege?.collegeType || result.type || 'Private',
            ranking: dbCollege?.rankings?.nirf || result.ranking || null,
            image: imageUrl,
            probability: result.probability || probability,
            previousCutoff: result.previousCutoff || cutoffRank?.toString() || 'N/A',
            fees: dbCollege?.fees?.annualTuitionFee || result.fees || 0,
            averagePackage: dbCollege?.placements?.averagePackage 
              ? dbCollege.placements.averagePackage * 100000 // Convert LPA to actual amount
              : result.averagePackage || 0,
            distance: result.distance || null,
            availableBranches: availableBranches,
            branch: result.branch,
            district: dbCollege?.location?.district || result.district,
            gender: result.gender,
            closingRank: cutoffRank,
            isBookmarked: bookmarkedColleges.has(result.id || index + 1),
            isRecommended: probability === 'high' || probability === 'good',
            // Additional fields from database
            established: dbCollege?.established,
            website: dbCollege?.website,
            placementRate: dbCollege?.placements?.placementRate,
            highestPackage: dbCollege?.placements?.highestPackage 
              ? dbCollege.placements.highestPackage * 100000 
              : null,
            // Location details
            nearestRailway: dbCollege?.location?.nearestRailway,
            nearestBusStand: dbCollege?.location?.nearestBusStand,
            campusArea: dbCollege?.campusArea,
            // Full location object for detailed display
            fullLocation: dbCollege?.location,
          };
        })
      );

      setColleges(enhancedColleges);
    } catch (error) {
      console.error('Error loading colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = (collegeId) => {
    setBookmarkedColleges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collegeId)) {
        newSet.delete(collegeId);
      } else {
        newSet.add(collegeId);
      }
      return newSet;
    });
    
    // Update college bookmark status
    setColleges(prev => prev.map(college => 
      college.id === collegeId 
        ? { ...college, isBookmarked: !college.isBookmarked }
        : college
    ));
  };

  const handleViewDetails = (collegeId) => {
    // Find the college by ID
    const college = colleges.find(c => c.id === collegeId);

    if (college) {
      setCollegeDetailsModal({ open: true, college });
      return;
    }

    alert('College details not available. Please try again.');
  };

  const sortOptions = [
    { value: 'cutoff', label: 'Cutoff Rank (Low to High)' },
    { value: 'name', label: 'College Name (A-Z)' },
    { value: 'fees', label: 'Fees (Low to High)' },
    { value: 'package', label: 'Package (High to Low)' },
  ];

  const filterOptions = [
    { value: 'all', label: 'All Colleges' },
    { value: 'recommended', label: 'Recommended' },
    { value: 'high-chance', label: 'High Chance' },
  ];

  const sortedAndFilteredColleges = [...colleges]
    .filter(college => {
      if (filterBy === 'recommended') return college.isRecommended;
      if (filterBy === 'high-chance') return college.probability === 'high' || college.probability === 'good';
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'cutoff':
          return (a.closingRank || 999999) - (b.closingRank || 999999);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'fees':
          return (a.fees || 0) - (b.fees || 0);
        case 'package':
          return (b.averagePackage || 0) - (a.averagePackage || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Loading Colleges</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
                  Explore Colleges
                </h1>
                <p className="text-muted-foreground">
                  Browse and compare colleges from your prediction results
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/college-prediction-engine')}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Back to Predictions
              </Button>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <Select
                  options={filterOptions}
                  value={filterBy}
                  onChange={setFilterBy}
                  placeholder="Filter by"
                  className="w-48"
                />
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="Sort by"
                  className="w-48"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {sortedAndFilteredColleges.length} of {colleges.length} colleges
              </div>
            </div>
          </div>

          {/* Colleges Grid */}
          {sortedAndFilteredColleges.length > 0 ? (
            <div className="space-y-4">
              {sortedAndFilteredColleges.map((college) => (
                <CollegeCard
                  key={college.id}
                  college={college}
                  onBookmark={handleBookmark}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-medium text-lg text-foreground mb-2">
                No Colleges Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or generate new predictions.
              </p>
              <Button
                onClick={() => navigate('/college-prediction-engine')}
                variant="default"
              >
                Generate New Predictions
              </Button>
            </div>
          )}
        </div>
      </main>

      <CollegeDetailsModal
        collegeId={collegeDetailsModal?.college?.id}
        collegeData={collegeDetailsModal?.college}
        isOpen={collegeDetailsModal?.open}
        onClose={() => setCollegeDetailsModal({ open: false, college: null })}
      />
    </div>
  );
};

export default ExploreColleges;

