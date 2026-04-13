import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterPanel from '../../components/ui/FilterPanel';
import CollegeDetailsModal from '../../components/ui/CollegeDetailsModal';
import SearchBar from './components/SearchBar';
import FilterChips from './components/FilterChips';
import CollegeCard from './components/CollegeCard';
import CollegeCardSkeleton from './components/CollegeCardSkeleton';
import SortDropdown from './components/SortDropdown';
import ViewToggle from './components/ViewToggle';
import ComparisonBar from './components/ComparisonBar';
import MapView from './components/MapView';
import LoadingGrid from './components/LoadingGrid';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { authAPI, collegesAPI } from '../../utils/api';
import { preloadCollegeImages } from '../../utils/imagePreloader';

const CollegeSearchFilter = () => {
  const navigate = useNavigate();

  // Exam type options
  const examTypeOptions = [
    { value: '', label: 'All Exam Types' },
    { value: 'AP EAPCET', label: 'AP EAPCET / AP ECET' },
    { value: 'NEET', label: 'NEET' },
    { value: 'JEE Main', label: 'JEE Main' },
    { value: 'JEE Advanced', label: 'JEE Advanced' }
  ];

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [bookmarkedColleges, setBookmarkedColleges] = useState(new Set());
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load initial bookmarks
  useEffect(() => {
    // FORCE-CLEAR POISONED BROWSER CACHE
    sessionStorage.clear();

    const loadBookmarks = async () => {
      try {
        const response = await authAPI.getBookmarks();
        if (response.data.success && response.data.bookmarks) {
          const bookmarkIds = response.data.bookmarks.map(b => {
            const collegeId = b.collegeId || b._id || b.id || b.bookmarkId;
            return typeof collegeId === 'object' ? collegeId?._id || collegeId?.id : collegeId;
          });
          setBookmarkedColleges(new Set(bookmarkIds.filter(Boolean)));
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    };
    loadBookmarks();
  }, []);

  // Load colleges from API
  useEffect(() => {
    const loadColleges = async () => {
      setLoading(true);
      try {
        const params = {
          limit: 1000, // Get more colleges
          page: 1,
        };

        // Add exam type filter if in filters
        if (filters?.examType) {
          params.examType = filters.examType;
        }

        // Add search query (debounced)
        if (searchQuery && searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        // Add college type filter
        if (filters?.collegeType && filters.collegeType.length > 0) {
          params.collegeType = filters.collegeType[0]; // Take first type for now
        }

        // Add location filter
        if (filters?.location && filters.location.length > 0) {
          params.state = filters.location[0]; // Take first location
        }

        const response = await collegesAPI.getAll(params);

        if (response.data.success) {
          const colleges = response.data.colleges || [];
          setColleges(colleges);

          // Temporarily disable image preloading to prevent API overload
          // TODO: Re-enable once backend is optimized
          // if (colleges.length > 0) {
          //   preloadCollegeImages(colleges).catch(error => {
          //     console.debug('Error preloading college images:', error);
          //   });
          // }
        } else {
          console.error('Failed to load colleges:', response.data.message);
          setColleges([]);
        }
      } catch (error) {
        console.error('Error loading colleges:', error);
        setColleges([]);
      } finally {
        setLoading(false);
      }
    };

    // Add debounce for search to reduce API calls
    const timeoutId = setTimeout(loadColleges, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters?.examType, filters?.collegeType, filters?.location]);

  // Filter and sort colleges
  const filteredAndSortedColleges = React.useMemo(() => {
    let filtered = colleges?.filter(college => {
      // Search query filter (client-side)
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const collegeName = (college?.name || college?.collegeName || '').toLowerCase();
        if (!collegeName.includes(query)) {
          return false;
        }
      }

      // Location filter (client-side for additional filtering)
      if (filters?.location && filters?.location?.length > 0) {
        const collegeState = typeof college?.location === 'string'
          ? college.location.split(', ')?.[1]?.toLowerCase()
          : college?.location?.state?.toLowerCase();
        if (!filters?.location?.some(loc => collegeState?.includes(loc?.toLowerCase()))) {
          return false;
        }
      }

      // College type filter (client-side for additional filtering)
      if (filters?.collegeType && filters?.collegeType?.length > 0) {
        const collegeType = (college?.collegeType || college?.type)?.toLowerCase();
        if (!filters?.collegeType?.some(type => collegeType?.includes(type?.toLowerCase()))) {
          return false;
        }
      }

      // Fees filter
      const collegeFees = college?.fees?.annualTuitionFee || college?.fees || 0;
      if (filters?.feesMin && collegeFees < parseInt(filters?.feesMin)) return false;
      if (filters?.feesMax && collegeFees > parseInt(filters?.feesMax)) return false;

      // Ranking filter
      const collegeRank = college?.rankings?.nirf || college?.ranking;
      if (filters?.rankingMin && collegeRank && collegeRank < parseInt(filters?.rankingMin)) return false;
      if (filters?.rankingMax && collegeRank && collegeRank > parseInt(filters?.rankingMax)) return false;

      return true;
    });

    // Sort colleges
    switch (sortBy) {
      case 'ranking':
        filtered?.sort((a, b) => {
          const rankA = a?.rankings?.nirf || a?.ranking || 9999;
          const rankB = b?.rankings?.nirf || b?.ranking || 9999;
          return rankA - rankB;
        });
        break;
      case 'fees-low':
        filtered?.sort((a, b) => {
          const feesA = a?.fees?.annualTuitionFee || a?.fees || 0;
          const feesB = b?.fees?.annualTuitionFee || b?.fees || 0;
          return feesA - feesB;
        });
        break;
      case 'fees-high':
        filtered?.sort((a, b) => {
          const feesA = a?.fees?.annualTuitionFee || a?.fees || 0;
          const feesB = b?.fees?.annualTuitionFee || b?.fees || 0;
          return feesB - feesA;
        });
        break;
      case 'cutoff-low':
      case 'cutoff-high':
        filtered?.sort((a, b) => {
          const getMinCutoff = (college) => {
            if (!college?.cutoffs?.length) return 999999;
            const relevantCutoffs = filters?.examType 
              ? college.cutoffs.filter(c => c.examType === filters.examType)
              : college.cutoffs;
            if (!relevantCutoffs.length) return 999999;
            return Math.min(...relevantCutoffs.map(c => c.closingRank || 999999));
          };
          const cutoffA = getMinCutoff(a);
          const cutoffB = getMinCutoff(b);
          return sortBy === 'cutoff-low' ? cutoffA - cutoffB : cutoffB - cutoffA;
        });
        break;
      case 'alphabetical':
        filtered?.sort((a, b) => a?.name?.localeCompare(b?.name));
        break;
      default:
        // Relevance - sort by name
        filtered?.sort((a, b) => a?.name?.localeCompare(b?.name));
    }

    return filtered;
  }, [colleges, searchQuery, filters, sortBy]);

  // Event handlers
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFiltersOrKey, value) => {
    if (typeof newFiltersOrKey === 'object') {
      // If it's an object, replace all filters
      setFilters(newFiltersOrKey);
    } else {
      // If it's a key-value pair, update that specific filter
      setFilters(prev => ({
        ...prev,
        [newFiltersOrKey]: value
      }));
    }
  };

  const handleRemoveFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({});
  };

  const handleBookmark = async (collegeId) => {
    const isBookmarked = bookmarkedColleges?.has(collegeId);

    // Optimistic local update
    setBookmarkedColleges(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.delete(collegeId);
      } else {
        newSet.add(collegeId);
      }
      return newSet;
    });

    try {
      if (isBookmarked) {
        // We might need the bookmark ID but removeBookmark accepts bookmark object with collegeId
        await authAPI.removeBookmark({ collegeId });
      } else {
        await authAPI.addBookmark({ collegeId, notes: '' });
      }
    } catch (error) {
      console.error('Error modifying bookmark:', error);
      // Revert if error
      setBookmarkedColleges(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) {
          newSet.add(collegeId);
        } else {
          newSet.delete(collegeId);
        }
        return newSet;
      });
    }
  };

  const handleCompare = (collegeId) => {
    const college = colleges?.find(c => (c?._id || c?.id) === collegeId);
    if (!college) return;

    setSelectedColleges(prev => {
      const isAlreadySelected = prev?.some(c => (c?._id || c?.id) === collegeId);
      if (isAlreadySelected) {
        return prev?.filter(c => (c?._id || c?.id) !== collegeId);
      } else if (prev?.length < 4) {
        return [...prev, college];
      }
      return prev;
    });
  };

  const handleRemoveFromComparison = (collegeId) => {
    setSelectedColleges(prev => prev?.filter(c => (c?._id || c?.id) !== collegeId));
  };

  const handleClearComparison = () => {
    setSelectedColleges([]);
  };

  const handleViewDetails = (collegeId) => {
    if (!collegeId) {
      console.error('No college ID provided for viewing details');
      return;
    }
    // Find the college data from our already loaded colleges
    const college = colleges.find(c => (c._id || c.id) === collegeId);
    setSelectedCollege(college);
    setIsModalOpen(true);
  };

  const handleCollegeSelect = (collegeId) => {
    handleViewDetails(collegeId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20 lg:pb-6">
        <div className="flex">
          {/* Filter Panel */}
          <FilterPanel
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="p-4 lg:p-6">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-2">
                      College Search & Filter
                    </h1>
                    <p className="text-muted-foreground">
                      Discover and compare colleges based on your preferences and entrance exam scores
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearch={handleSearch}
                  className="mb-4"
                />

                {/* Mobile Exam Type Dropdown */}
                <div className="sm:hidden mb-4">
                  <Select
                    options={examTypeOptions}
                    value={filters?.examType || ''}
                    onChange={(value) => handleFiltersChange('examType', value)}
                    placeholder="Select Exam Type"
                    className="w-full"
                  />
                </div>

                {/* Filter Chips */}
                <FilterChips
                  activeFilters={filters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                  className="mb-4"
                />

                {/* Controls */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsFilterPanelOpen(true)}
                      iconName="Filter"
                      iconPosition="left"
                      className="lg:hidden"
                    >
                      Filters
                    </Button>

                    {/* Quick Exam Type Dropdown */}
                    <div className="hidden sm:block">
                      <Select
                        options={examTypeOptions}
                        value={filters?.examType || ''}
                        onChange={(value) => handleFiltersChange('examType', value)}
                        placeholder="Select Exam Type"
                        className="w-48"
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {loading ? 'Loading...' : `${filteredAndSortedColleges?.length} colleges found`}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <SortDropdown
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                    />

                    <ViewToggle
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  </div>
                </div>
              </div>

              {/* Content Area */}
              {loading ? (
                <LoadingGrid count={6} />
              ) : viewMode === 'map' ? (
                <MapView
                  colleges={filteredAndSortedColleges}
                  onCollegeSelect={handleCollegeSelect}
                />
              ) : (
                <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                  {filteredAndSortedColleges?.map((college) => (
                    <CollegeCard
                      key={college?._id || college?.id}
                      college={college}
                      onBookmark={handleBookmark}
                      onCompare={handleCompare}
                      onViewDetails={handleViewDetails}
                      isBookmarked={bookmarkedColleges?.has(college?._id || college?.id)}
                      isComparing={selectedColleges?.some(c => (c?._id || c?.id) === (college?._id || college?.id))}
                      viewMode={viewMode}
                    />
                  ))}

                  {/* Show skeleton loaders while images are loading */}
                  {loading && filteredAndSortedColleges?.length > 0 && (
                    <>
                      <CollegeCardSkeleton />
                      <CollegeCardSkeleton />
                      <CollegeCardSkeleton />
                    </>
                  )}
                </div>
              )}

              {/* No Results */}
              {!loading && filteredAndSortedColleges?.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    No colleges found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {colleges?.length === 0
                      ? 'No colleges in the database yet. Ask an admin to upload college data (CSV) from the Admin Panel.'
                      : 'No colleges match your current filters. Try clearing filters or selecting a different exam type.'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleClearAllFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Comparison Bar */}
      <ComparisonBar
        selectedColleges={selectedColleges}
        onRemoveCollege={handleRemoveFromComparison}
        onClearAll={handleClearComparison}
        onBookmark={() => {
          // Bulk bookmark for search results
          selectedColleges.forEach(college => handleBookmark(college?._id || college?.id));
        }}
      />
      {/* College Details Modal */}
      <CollegeDetailsModal
        collegeId={selectedCollege?._id || selectedCollege?.id}
        collegeData={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        comparisonMode={true}
        onBookmark={() => handleBookmark(selectedCollege?._id || selectedCollege?.id)}
        onCompare={() => handleCompare(selectedCollege?._id || selectedCollege?.id)}
        isBookmarked={bookmarkedColleges?.has(selectedCollege?._id || selectedCollege?.id)}
        isComparing={selectedColleges?.some(c => (c?._id || c?.id) === (selectedCollege?._id || selectedCollege?.id))}
      />
    </div>
  );
};

export default CollegeSearchFilter;