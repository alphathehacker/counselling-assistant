import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../AppIcon';
import Button from './Button';
import Image from '../AppImage';
import { predictionAPI, isValidObjectId } from '../../utils/api.js';
import { getCollegeImageUrl } from '../../utils/collegeImageService.js';

const CollegeDetailsModal = ({
  collegeId,
  collegeData,
  isOpen,
  onClose,
  comparisonMode = false,
  onBookmark,
  onCompare,
  isBookmarked = false,
  isComparing = false,
}) => {
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Cache for previously loaded colleges to avoid re-fetching
  const collegeCache = useRef(new Map());

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCollege(null);
      setError(null);
      setActiveTab('overview');
      return;
    }

    // If we have college data passed in, use it directly
    if (collegeData) {
      const cacheKey = collegeData._id || collegeData.id;

      // Check if we have this college cached
      if (collegeCache.current.has(cacheKey)) {
        setCollege(collegeCache.current.get(cacheKey));
        return;
      }

      setCollege(collegeData);
      collegeCache.current.set(cacheKey, collegeData);

      // Only fetch image if not already present
      if (!collegeData.imageUrl && collegeData.name) {
        const fetchImage = async () => {
          const locationObj = typeof collegeData.location === 'object' ? collegeData.location : null;
          const locationStr = locationObj
            ? `${locationObj.city || ''}, ${locationObj.state || ''}`.trim()
            : typeof collegeData.location === 'string'
              ? collegeData.location
              : '';

          try {
            const imageUrl = await getCollegeImageUrl(
              collegeData.name,
              locationStr,
              collegeData._id || collegeData.id
            );
            // Update both state and cache with the image URL
            const updatedCollege = { ...collegeData, imageUrl };
            setCollege(updatedCollege);
            collegeCache.current.set(cacheKey, updatedCollege);
          } catch (imgError) {
            console.warn('Error fetching college image:', imgError);
          }
        };
        fetchImage();
      }
      return;
    }

    // Fallback: Fetch college data from API if no data was passed or ID-based lookup failed
    // This is common in results pages where 'collegeId' might be a prediction row ID instead of a DB ID
    if (collegeId || (collegeData?.name && !collegeData?.rankings?.nirf)) {
      const fetchCollegeData = async () => {
        setLoading(true);
        setError(null);
        try {
          let fetchedData = null;

          // Helper function to check if ID is a valid MongoDB ObjectId
          const isValidObjectId = (id) => {
            if (!id) return false;
            const idStr = String(id);
            return /^[0-9a-fA-F]{24}$/.test(idStr);
          };

          // Strategy 1: Fetch by ID if it's a valid format
          if (collegeId && isValidObjectId(collegeId)) {
            try {
              const idResponse = await predictionAPI.getCollegeById(collegeId);
              if (idResponse.data.success && idResponse.data.college) {
                fetchedData = idResponse.data.college;
              }
            } catch (idErr) {
              console.warn('Failed to fetch college by ID, trying by name fallback');
            }
          }

          // Strategy 2: Fetch by Name if ID strategy failed/skipped
          if (!fetchedData && (collegeData?.name || collegeId)) {
            const searchName = collegeData?.name || collegeId;
            const nameResponse = await predictionAPI.getCollegesByNames([searchName]);
            if (nameResponse.data.success && nameResponse.data.colleges) {
              const matchedCollege = Object.values(nameResponse.data.colleges)[0];
              if (matchedCollege) {
                fetchedData = matchedCollege;
              }
            }
          }

          if (fetchedData) {
            // Fetch/refresh image if needed
            if (!fetchedData.imageUrl && fetchedData.name) {
              const locationStr = fetchedData.location
                ? `${fetchedData.location.city || ''}, ${fetchedData.location.state || ''}`.trim()
                : '';
              try {
                const imageUrl = await getCollegeImageUrl(fetchedData.name, locationStr, fetchedData._id || collegeId);
                fetchedData.imageUrl = imageUrl;
              } catch (imgError) {
                console.warn('Error fetching college image:', imgError);
              }
            }

            // Sync with existing prediction data if we have it
            if (collegeData) {
              setCollege({
                ...collegeData,
                ...fetchedData,
                // Preserve prediction-specific context
                branch: collegeData.branch || fetchedData.branch,
                admissionProbability: collegeData.admissionProbability || fetchedData.admissionProbability,
                location: {
                  ...(fetchedData.location || {}),
                  ...(collegeData.location || {}),
                  // Don't let empty prediction-strings overwrite real city/state
                  city: fetchedData.location?.city || (typeof collegeData.location === 'object' ? collegeData.location?.city : '') || '',
                  state: fetchedData.location?.state || (typeof collegeData.location === 'object' ? collegeData.location?.state : '') || '',
                }
              });
            } else {
              setCollege(fetchedData);
            }
          } else {
            setError('College details not found');
          }
        } catch (err) {
          console.error('Error fetching college details:', err);
          setError(err.response?.data?.message || 'Failed to load college details');
        } finally {
          setLoading(false);
        }
      };

      fetchCollegeData();
    }
  }, [isOpen, collegeId, collegeData]);

  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return value;
  };

  const locationObj =
    college?.location && typeof college.location === 'object'
      ? college.location
      : college?.fullLocation && typeof college.fullLocation === 'object'
        ? college.fullLocation
        : college?.full_location && typeof college.full_location === 'object'
          ? college.full_location
          : null;

  const buildMapsSearchUrl = (placeName) => {
    const locationText =
      locationObj?.city && locationObj?.state
        ? `${locationObj.city}, ${locationObj.state}`
        : typeof college?.location === 'string'
          ? college.location
          : '';

    const query = [placeName, locationText].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const cutoffsEntries = Object.entries(college?.cutoffs || {});
  const feesEntries = Object.entries(college?.fees || {});
  const totalAnnualFee = Object.values(college?.fees || {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'Info' },
    { id: 'cutoffs', label: 'Cutoffs', icon: 'TrendingUp' },
    { id: 'fees', label: 'Fees', icon: 'DollarSign' },
    { id: 'placements', label: 'Placements', icon: 'Briefcase' },
    { id: 'courses', label: 'Courses', icon: 'BookOpen' }
  ];

  const handleBookmark = () => {
    if (college && onBookmark) onBookmark(college);
  };

  const handleCompare = () => {
    if (college && onCompare) onCompare(college);
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-lg shadow-modal overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Loading college details...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 p-6">
            <Icon name="AlertCircle" size={48} className="text-error mb-4" />
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              Error Loading College Details
            </h3>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : college ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="font-heading font-semibold text-xl text-foreground">
                    {college?.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {locationObj
                      ? `${locationObj.city || ''}, ${locationObj.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                      : typeof college?.location === 'string'
                        ? college.location
                        : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={handleBookmark}
                  iconName={isBookmarked ? "BookmarkCheck" : "Bookmark"}
                  iconPosition="left"
                >
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>

                {comparisonMode && (
                  <Button
                    variant={isComparing ? 'default' : 'secondary'}
                    size="sm"
                    onClick={handleCompare}
                    iconName={isComparing ? 'Check' : 'Plus'}
                    iconPosition="left"
                  >
                    {isComparing ? 'Added' : 'Compare'}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 transition-smooth ${activeTab === tab?.id
                      ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span className="font-medium text-sm">{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <Image
                    src={college?.imageUrl || college?.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23f3f4f6'/%3E%3Ctext x='320' y='180' font-family='Arial' font-size='18' fill='%236b7280' text-anchor='middle' dy='.3em'%3ECollege Image%3C/text%3E%3C/svg%3E"}
                    alt={college?.name}
                    className="w-full h-48 rounded-lg object-cover"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-heading font-medium text-sm text-muted-foreground mb-1">
                        NIRF Ranking
                      </h4>
                      <p className="font-mono font-medium text-2xl text-foreground">
                        {college?.rankings?.nirf || college?.ranking?.nirf || college?.ranking || college?.nirfRank ? `#${college?.rankings?.nirf || college?.ranking?.nirf || college?.ranking || college?.nirfRank}` : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-heading font-medium text-sm text-muted-foreground mb-1">
                        Established
                      </h4>
                      <p className="font-mono font-medium text-2xl text-foreground">
                        {getDisplayValue(college?.established)}
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-heading font-medium text-sm text-muted-foreground mb-1">
                        Type
                      </h4>
                      <p className="font-medium text-lg text-foreground">
                        {getDisplayValue(college?.collegeType || college?.type || college?.college_type)}
                      </p>
                    </div>
                  </div>

                  {college?.description && (
                    <div>
                      <h4 className="font-heading font-medium text-lg text-foreground mb-2">
                        About
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {college.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-heading font-medium text-lg text-foreground mb-3">
                      Facilities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {college?.facilities?.map((facility, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">College Name</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.name)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Short Name</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.shortName)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">College Code</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.code)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">College Type</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.collegeType || college?.type || college?.college_type)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Location Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">City</p>
                        <p className="font-medium text-foreground">{getDisplayValue(locationObj?.city)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">State</p>
                        <p className="font-medium text-foreground">{getDisplayValue(locationObj?.state)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">District</p>
                        <p className="font-medium text-foreground">{getDisplayValue(locationObj?.district)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pincode</p>
                        <p className="font-medium text-foreground">{getDisplayValue(locationObj?.pincode)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium text-foreground">{getDisplayValue(locationObj?.address || college?.address || college?.location?.address)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Nearest Railway Station</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{getDisplayValue(locationObj?.nearestRailway || college?.nearestRailway || college?.nearest_railway)}</p>
                          {(locationObj?.nearestRailway || college?.nearestRailway || college?.nearest_railway) ? (
                            <a
                              href={buildMapsSearchUrl(locationObj?.nearestRailway || college?.nearestRailway || college?.nearest_railway)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Open Map
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nearest Bus Stand</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{getDisplayValue(locationObj?.nearestBusStand || college?.nearestBusStand || college?.nearest_bus_stand)}</p>
                          {(locationObj?.nearestBusStand || college?.nearestBusStand || college?.nearest_bus_stand) ? (
                            <a
                              href={buildMapsSearchUrl(locationObj?.nearestBusStand || college?.nearestBusStand || college?.nearest_bus_stand)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Open Map
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Campus Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Campus Area (Acres)</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.campusArea || college?.campus_area)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Established Year</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.established || college?.establishedYear || college?.established_year)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Affiliation</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.affiliation)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        {college?.website ? (
                          <a
                            href={college.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            {college.website}
                          </a>
                        ) : (
                          <p className="font-medium text-foreground">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.contact?.phone)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.contact?.email)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Fee Structure (₹)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Tuition Fee</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.fees?.annualTuitionFee || college?.fees?.tuition_fee || college?.fees?.tuition)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Hostel Fee</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.fees?.annualHostelFee || college?.fees?.hostel_fee || college?.fees?.hostel)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Mess Fee</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.fees?.annualMessFee || college?.fees?.mess_fee || college?.fees?.mess)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total First Year Fee</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.fees?.totalFirstYearFee || college?.fees?.total_fee || college?.fees?.total)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Placement Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Package (LPA)</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.placements?.averagePackage || college?.averagePackage || college?.average_package)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Highest Package (LPA)</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.placements?.highestPackage || college?.highestPackage || college?.highest_package)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Placement Rate (%)</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.placements?.placementRate || college?.placementRate || college?.placement_rate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Top Recruiters</p>
                        <p className="font-medium text-foreground">
                          {Array.isArray(college?.placements?.topRecruiters) && college.placements.topRecruiters.length > 0
                            ? college.placements.topRecruiters.join(', ')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-heading font-medium text-lg text-foreground">Rankings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">NIRF Rank</p>
                        <p className="font-medium text-foreground">{getDisplayValue(college?.rankings?.nirf || college?.ranking?.nirf || college?.ranking || college?.nirfRank)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cutoffs' && (
                <div className="space-y-4">
                  <h4 className="font-heading font-medium text-lg text-foreground">
                    Cutoff Information
                  </h4>

                  {college?.cutoffs && Array.isArray(college.cutoffs) && college.cutoffs.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group cutoffs by exam type */}
                      {[...new Set(college.cutoffs.map(c => c.examType))].map(examType => {
                        const examCutoffs = college.cutoffs.filter(c => c.examType === examType);
                        return (
                          <div key={examType} className="space-y-4">
                            <h5 className="font-heading font-semibold text-base text-foreground border-b border-border pb-2">
                              {examType}
                            </h5>

                            {/* Group by branch */}
                            {[...new Set(examCutoffs.map(c => c.branch))].map(branch => {
                              const branchCutoffs = examCutoffs.filter(c => c.branch === branch);
                              return (
                                <div key={branch} className="space-y-3">
                                  <h6 className="font-medium text-sm text-primary">{branch}</h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {branchCutoffs.map((cutoff, idx) => (
                                      <div key={idx} className="bg-muted rounded-lg p-4">
                                        <h5 className="font-heading font-medium text-xs text-muted-foreground mb-2">
                                          {cutoff.category?.toUpperCase()} ({cutoff.year || 'N/A'})
                                        </h5>
                                        {cutoff.closingRank ? (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Closing Rank</p>
                                            <p className="font-mono font-medium text-lg text-foreground">
                                              {cutoff.closingRank}
                                            </p>
                                          </div>
                                        ) : cutoff.closingPercentile ? (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Closing Percentile</p>
                                            <p className="font-mono font-medium text-lg text-foreground">
                                              {cutoff.closingPercentile}%
                                            </p>
                                          </div>
                                        ) : null}
                                        {cutoff.openingRank && (
                                          <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-1">Opening Rank</p>
                                            <p className="font-mono font-medium text-sm text-foreground">
                                              {cutoff.openingRank}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ) : cutoffsEntries.length > 0 ? (
                    // Fallback to old format if cutoffs is an object
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cutoffsEntries.map(([category, rank]) => (
                        <div key={category} className="bg-muted rounded-lg p-4">
                          <h5 className="font-heading font-medium text-sm text-muted-foreground mb-1">
                            {category?.toUpperCase()}
                          </h5>
                          <p className="font-mono font-medium text-2xl text-foreground">
                            {rank}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No cutoff information available</p>
                  )}
                </div>
              )}

              {activeTab === 'fees' && (
                <div className="space-y-4">
                  <h4 className="font-heading font-medium text-lg text-foreground">
                    Annual Fee Structure
                  </h4>

                  <div className="space-y-3">
                    {feesEntries.map(([type, amount]) => (
                      <div key={type} className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
                        <span className="font-medium text-foreground capitalize">
                          {type} Fee
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          ₹{amount?.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center py-3 border-t-2 border-border font-semibold">
                      <span className="text-foreground">Total Annual Fee</span>
                      <span className="font-mono text-primary">
                        ₹{totalAnnualFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'placements' && (
                <div className="space-y-4">
                  <h4 className="font-heading font-medium text-lg text-foreground">
                    Placement Statistics (2025)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <h5 className="font-heading font-medium text-sm text-success mb-1">
                        Placement Rate
                      </h5>
                      <p className="font-mono font-medium text-2xl text-success">
                        {college?.placements?.placementRate}%
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                      <h5 className="font-heading font-medium text-sm text-muted-foreground mb-1">
                        Average Package
                      </h5>
                      <p className="font-mono font-medium text-lg text-foreground">
                        {college?.placements?.averagePackage
                          ? `₹${(college.placements.averagePackage >= 10000 ? college.placements.averagePackage / 100000 : college.placements.averagePackage).toFixed(1)}L`
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                      <h5 className="font-heading font-medium text-sm text-muted-foreground mb-1">
                        Highest Package
                      </h5>
                      <p className="font-mono font-medium text-lg text-foreground">
                        {college?.placements?.highestPackage
                          ? `₹${(college.placements.highestPackage >= 10000 ? college.placements.highestPackage / 100000 : college.placements.highestPackage).toFixed(1)}L`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <h4 className="font-heading font-medium text-lg text-foreground">
                    Available Courses/Branches
                  </h4>

                  {college?.branches && college.branches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {college.branches.map((branch, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <Icon name="BookOpen" size={16} className="text-primary" />
                          <div className="flex-1">
                            <span className="font-medium text-foreground">{branch.name || branch}</span>
                            {branch.code && (
                              <span className="text-sm text-muted-foreground ml-2">({branch.code})</span>
                            )}
                            {branch.duration && (
                              <p className="text-xs text-muted-foreground mt-1">{branch.duration} years</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : college?.courses && college.courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {college.courses.map((course, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <Icon name="BookOpen" size={16} className="text-primary" />
                          <span className="font-medium text-foreground">{course}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No courses information available</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};


export default CollegeDetailsModal;