import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PredictionSummary from './components/PredictionSummary';
import SearchBar from './components/SearchBar';
import FilterSortPanel from './components/FilterSortPanel';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import StatsSummary from './components/StatsSummary';
import ResultsGrid from './components/ResultsGrid';
import MapView from '../college-search-filter/components/MapView';
import ExportModal from './components/ExportModal';
import CollegeDetailsModal from '../../components/ui/CollegeDetailsModal';
import ComparisonBar from '../college-search-filter/components/ComparisonBar';
import { predictionAPI, collegesAPI, authAPI, isValidObjectId } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PredictionResultsReports = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [collegeDetailsModal, setCollegeDetailsModal] = useState({ open: false, collegeId: null, collegeData: null });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('probability');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: null, message: '' });

  // Save predicted colleges to bookmarks in database (persists across sessions)
  const savePredictedCollegesToBookmarks = async (predictions) => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser.id || 'anonymous';

      if (!storedToken || !storedUser.id) return;

      const urlParams = new URLSearchParams(location.search);
      const savedPredictionsKey = `savedPredictions_${userId}`;
      const lastSaved = localStorage.getItem(savedPredictionsKey);

      if (lastSaved) {
        const savedData = JSON.parse(lastSaved);
        if (savedData.predictionId === urlParams.get('id')) return;
      }

      // Save to database via API (with localStorage fallback if API fails)
      for (const college of predictions) {
        const collegeId = college._id || college.id;
        if (!collegeId) continue;
        const hasValidId = isValidObjectId(collegeId);

        const bookmarkData = {
          collegeId,
          collegeName: college.name,
          listId: 'predicted',
          type: 'predicted',
          predictionData: {
            probability: college.probability || college.matchPercentage,
            category: college.category,
            cutoff: college.cutoff,
            fees: college.fees,
            placement: college.placements,
            cetDetails: {
              examType: predictionData?.examType,
              rank: predictionData?.rank,
              category: predictionData?.category,
              branch: college.branch || college.department,
              predictedCategory: college.category,
            },
          },
          dateAdded: new Date().toISOString(),
        };

        try {
          if (hasValidId) {
            await authAPI.addBookmark(bookmarkData);
          } else {
            throw new Error('Invalid college ID for DB');
          }
        } catch (apiError) {
          // Fallback to localStorage when API fails or college not in DB
          const existingBookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
          if (!existingBookmarks.some(b => (b.collegeId || b._id) === collegeId)) {
            existingBookmarks.push({ ...bookmarkData, college: { ...college } });
            localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(existingBookmarks));
          }
        }
      }

      localStorage.setItem(savedPredictionsKey, JSON.stringify({
        timestamp: Date.now(),
        predictionId: urlParams.get('id'),
      }));
    } catch (error) {
      console.error('Error saving predicted colleges to bookmarks:', error);
    }
  };

  // Load prediction results from database (user-specific) or sessionStorage
  useEffect(() => {
    const loadPredictionResults = async () => {
      setLoading(true);
      try {
        // Clear sessionStorage to avoid mixing user data
        sessionStorage.removeItem('predictionResults');
        sessionStorage.removeItem('predictionParams');

        // Priority 1: Check for predictionResultId in URL params or location state
        const urlParams = new URLSearchParams(location.search);
        const predictionResultId = urlParams.get('id') || location.state?.predictionResultId;
        const autoExport = urlParams.get('autoExport');

        let predictions = [];
        let predictionParams = null;
        let predictionResult = null;

        if (predictionResultId) {
          // Check if this is a session-based prediction (starts with 'pred_')
          if (predictionResultId.startsWith('pred_')) {
            console.log('Loading session-based prediction results');
            // Load from sessionStorage
            const sessionResults = sessionStorage.getItem('predictionResults');
            const sessionParams = sessionStorage.getItem('predictionParams');

            if (sessionResults) {
              const resultsData = JSON.parse(sessionResults);
              predictions = resultsData.flat || [];
              predictionParams = sessionParams ? JSON.parse(sessionParams) : null;
              console.log('Loaded predictions from sessionStorage:', predictions.length);
            }
          } else {
            // Fetch from database (user-specific)
            try {
              const response = await predictionAPI.getResultById(predictionResultId);
              if (response.data.success && response.data.predictionResult) {
                predictionResult = response.data.predictionResult;
                predictions = predictionResult.predictions || [];
                predictionParams = predictionResult.predictionParams;
              }
            } catch (error) {
              console.error('Error fetching prediction result from database:', error);
              // Fall through to generate new prediction
            }
          }
        }

        // Priority 2: If no database results, check if user needs to generate new prediction
        if (predictions.length === 0) {
          // Get user ID from localStorage (skip API call to avoid console errors when backend unavailable)
          let userId = 'anonymous';
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser.id) {
            userId = storedUser.id;
          }

          // Note: We skip getCurrentUser() verification here to avoid console errors
          // when backend is unavailable. sessionStorage keys use userId from localStorage.

          const storedPredictionResults = sessionStorage.getItem(`predictionResults_${userId}`);
          const storedPredictionParams = sessionStorage.getItem(`predictionParams_${userId}`);

          if (storedPredictionResults && storedPredictionParams) {
            // Use stored data for current user
            const parsedResults = JSON.parse(storedPredictionResults);
            predictionParams = JSON.parse(storedPredictionParams);
            predictions = parsedResults.flat || [];
          } else {
            // Only check location state for new prediction (don't use sessionStorage for security)
            if (location.state?.predictionParams) {
              predictionParams = location.state.predictionParams;
              const response = await predictionAPI.predict(predictionParams);
              sessionStorage.setItem(`predictionParams_${userId}`, JSON.stringify(predictionParams));

              // If predictionResultId was returned, update URL
              if (response.data.predictionResultId) {
                window.history.replaceState(
                  {},
                  '',
                  `${location.pathname}?id=${response.data.predictionResultId}`
                );
              }
            }
          }
        }

        if (predictions.length > 0 && predictionParams) {
          setNoResultsMessage('');
          // Set prediction summary data (use summary from database if available)
          const rank = predictionParams.rank || parseFloat(sessionStorage.getItem('userRank') || '0');

          setPredictionData({
            examType: predictionParams.examType,
            rank: rank,
            category: predictionParams.category,
            preferences: [
              ...(predictionParams.preferredBranches || []),
              ...(predictionParams.districts || []),
              predictionParams.round ? `Round ${predictionParams.round}` : null,
              predictionParams.gender && predictionParams.gender !== 'Gender-Neutral' ? predictionParams.gender : null,
              ...(predictionParams.instituteGroups || [])
            ].filter(Boolean),
            totalColleges: predictionResult?.summary?.totalColleges || predictions.length,
            distribution: predictionResult?.summary ? {
              high: predictionResult.summary.highProbability || 0,
              moderate: predictionResult.summary.moderateProbability || 0,
              low: predictionResult.summary.lowProbability || 0,
            } : {
              high: predictions.filter(p => {
                const prob = p.probability || p.admissionProbability;
                return prob === 'high' || prob >= 70;
              }).length,
              moderate: predictions.filter(p => {
                const prob = p.probability || p.admissionProbability;
                return prob === 'medium' || (prob >= 40 && prob < 70);
              }).length,
              low: predictions.filter(p => {
                const prob = p.probability || p.admissionProbability;
                return prob === 'low' || prob < 40;
              }).length
            }
          });

          // Fetch full college details from database dynamically for N/A fallback handling
          const collegeNames = [...new Set(predictions.map(r => r.collegeName || r.name).filter(Boolean))];
          let collegeDetailsMap = {};
          try {
            if (collegeNames.length > 0) {
              const detailsResponse = await predictionAPI.getCollegesByNames(collegeNames);
              if (detailsResponse?.data?.success) {
                collegeDetailsMap = detailsResponse.data.colleges || {};
              }
            }
          } catch (error) {
            console.warn('Could not fetch college details from database:', error);
          }

          // Process predictions - they should already have college details from the API
          const collegesWithPredictions = predictions.map((prediction) => {
            const predName = prediction.collegeName || prediction.name;
            const dbCollege = collegeDetailsMap[predName] || null;

            // Calculate admission probability
            let admissionProbability = prediction.admissionProbability;
            if (typeof admissionProbability === 'string') {
              if (admissionProbability === 'high') admissionProbability = 85;
              else if (admissionProbability === 'medium') admissionProbability = 50;
              else admissionProbability = 20;
            } else if (!admissionProbability && prediction.cutoffRank && rank) {
              const rankDiff = (prediction.cutoffRank || 0) - rank;
              const percentDiff = ((prediction.cutoffRank || 1) > 0 ? (rankDiff / prediction.cutoffRank) * 100 : 0);
              if (percentDiff > 30) admissionProbability = 85;
              else if (percentDiff > 15) admissionProbability = 70;
              else if (percentDiff > 0) admissionProbability = 50;
              else if (percentDiff > -10) admissionProbability = 30;
              else admissionProbability = 10;
            }

            // Fallback: If not found by primary name key, try a partial search in collegeDetailsMap
            let foundDbCollege = dbCollege;
            if (!foundDbCollege) {
              const predNameLower = predName.toLowerCase();
              const matchedKey = Object.keys(collegeDetailsMap).find(k =>
                predNameLower.includes(k.toLowerCase()) ||
                k.toLowerCase().includes(predNameLower)
              );
              if (matchedKey) foundDbCollege = collegeDetailsMap[matchedKey];
            }

            // Only use _id if it's a valid MongoDB ObjectId format (24 hex chars)
            const isValidObjectId = (id) => {
              if (!id) return false;
              const idStr = String(id);
              return /^[0-9a-fA-F]{24}$/.test(idStr);
            };

            const collegeId = prediction.collegeId || prediction._id || prediction.id || foundDbCollege?._id;
            const validId = isValidObjectId(collegeId) ? collegeId : null;

            return {
              _id: validId,
              id: validId,
              name: predName,
              shortName: prediction.shortName || foundDbCollege?.shortName,
              location: {
                ...(foundDbCollege?.location || {}),
                ...(typeof prediction.location === 'object' ? prediction.location : {}),
                city: (typeof prediction.location === 'object' && prediction.location?.city) ? prediction.location.city : (foundDbCollege?.location?.city || ''),
                state: (typeof prediction.location === 'object' && prediction.location?.state) ? prediction.location.state : (foundDbCollege?.location?.state || ''),
                district: prediction.district || (typeof prediction.location === 'object' ? prediction.location?.district : '') || foundDbCollege?.location?.district || '',
                address: foundDbCollege?.location?.address || (typeof prediction.location === 'object' ? prediction.location?.address : '') || '',
                nearestRailway: foundDbCollege?.location?.nearestRailway || (typeof prediction.location === 'object' ? prediction.location?.nearestRailway : '') || '',
                nearestBusStand: foundDbCollege?.location?.nearestBusStand || (typeof prediction.location === 'object' ? prediction.location?.nearestBusStand : '') || '',
                pincode: foundDbCollege?.location?.pincode || (typeof prediction.location === 'object' ? prediction.location?.pincode : '') || ''
              },
              branch: prediction.branch,
              district: prediction.district || foundDbCollege?.location?.district || foundDbCollege?.location?.city,
              imageUrl: prediction.imageUrl || foundDbCollege?.imageUrl,
              image: prediction.imageUrl || foundDbCollege?.imageUrl,
              admissionProbability: admissionProbability || prediction.admissionProbability || 50,
              previousCutoff: prediction.cutoffRank || prediction.previousCutoff,
              predictedCutoff: prediction.predictedCutoff || Math.round((prediction.cutoffRank || 0) * 0.95),
              rankings: { ...(foundDbCollege?.rankings || {}), ...(typeof prediction.rankings === 'object' ? prediction.rankings : {}) },
              nirfRank: (typeof prediction.rankings === 'object' ? prediction.rankings?.nirf : null) || prediction.nirfRank || foundDbCollege?.rankings?.nirf,
              fees: { ...(foundDbCollege?.fees || {}), ...(typeof prediction.fees === 'object' ? prediction.fees : {}) },
              placements: { ...(foundDbCollege?.placements || {}), ...(typeof prediction.placements === 'object' ? prediction.placements : {}) },
              averagePackage: (typeof prediction.placements === 'object' ? prediction.placements?.averagePackage : null) || prediction.averagePackage || foundDbCollege?.placements?.averagePackage,
              collegeType: prediction.collegeType || foundDbCollege?.collegeType,
              established: prediction.established || foundDbCollege?.established,
              affiliation: prediction.affiliation || foundDbCollege?.affiliation,
              website: prediction.website || foundDbCollege?.website,
              contact: { ...(foundDbCollege?.contact || {}), ...(typeof prediction.contact === 'object' ? prediction.contact : {}) },
              campusArea: prediction.campusArea || foundDbCollege?.campusArea,
              facilities: prediction.facilities || foundDbCollege?.facilities,
              courses: prediction.courses || foundDbCollege?.courses,
              branches: prediction.branches || foundDbCollege?.branches,
              cutoff: prediction.cutoff || foundDbCollege?.cutoff,
              cutoffs: (prediction.cutoffRank || prediction.previousCutoff) ? [
                {
                  examType: prediction.examType || (
                    prediction.branch === 'MBBS' || prediction.branch === 'BDS' ? 'NEET' : 
                    (predName.includes('Indian Institute of Technology') || predName.startsWith('IIT ')) ? 'JEE Advanced' :
                    (predName.includes('National Institute of Technology') || predName.startsWith('NIT ') || predName.includes('IIIT')) ? 'JEE Main' :
                    predictionData?.examType || 'AP EAPCET'
                  ),
                  branch: prediction.branch,
                  category: (predictionData?.category || 'OC_BOYS').toUpperCase(),
                  year: `${new Date().getFullYear() - 1} (Previous)`,
                  closingRank: prediction.cutoffRank || prediction.previousCutoff
                },
                {
                  examType: prediction.examType || (
                    prediction.branch === 'MBBS' || prediction.branch === 'BDS' ? 'NEET' : 
                    (predName.includes('Indian Institute of Technology') || predName.startsWith('IIT ')) ? 'JEE Advanced' :
                    (predName.includes('National Institute of Technology') || predName.startsWith('NIT ') || predName.includes('IIIT')) ? 'JEE Main' :
                    predictionData?.examType || 'AP EAPCET'
                  ),
                  branch: prediction.branch,
                  category: (predictionData?.category || 'OC_BOYS').toUpperCase(),
                  year: `${new Date().getFullYear()} (Predicted)`,
                  closingRank: prediction.predictedCutoff || Math.round((prediction.cutoffRank || 0) * 0.95)
                },
                ...(foundDbCollege?.cutoffs && Array.isArray(foundDbCollege.cutoffs) ? foundDbCollege.cutoffs : [])
              ].filter((v, i, a) => a.findIndex(t => (t.examType === v.examType && t.branch === v.branch && t.category === v.category && t.year === v.year)) === i) : foundDbCollege?.cutoffs || [],
              code: prediction.code || foundDbCollege?.code,
              isBookmarked: prediction.isBookmarked || false
            };
          });

          setColleges(collegesWithPredictions);
          setFilteredColleges(collegesWithPredictions);

          // Save predicted colleges to bookmarks automatically
          savePredictedCollegesToBookmarks(collegesWithPredictions);

          // If coming from dashboard with autoExport flag, immediately open export modal
          if (autoExport) {
            setExportModalOpen(true);
          }
        } else {
          // No prediction data found or no colleges matched the preferences.
          // Keep the user on this page and show an explanatory message instead of redirecting.
          setPredictionData(null);
          setColleges([]);
          setFilteredColleges([]);

          if (predictionParams) {
            console.warn('Prediction completed but no colleges matched the given preferences.');
            setNoResultsMessage(
              'Your preferences do not match any colleges based on previous year last-rank details. Try changing your rank, category, round, or other filters and run the prediction again.'
            );
          } else {
            console.warn('No prediction results found for this user yet.');
            setNoResultsMessage(
              'You have not run any predictions yet. Use the Prediction Engine to generate a prediction, and the results will appear here.'
            );
          }
        }
      } catch (error) {
        console.error('Error loading prediction results:', error);
        setColleges([]);
        setFilteredColleges([]);
      } finally {
        setLoading(false);
      }
    };

    loadPredictionResults();
  }, [location.state, navigate]);

  // Filter and sort colleges
  useEffect(() => {
    let filtered = [...colleges];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered?.filter(college => {
        const searchLower = searchTerm?.toLowerCase();
        const locationStr = typeof college?.location === 'string'
          ? college.location
          : `${college?.location?.city || ''}, ${college?.location?.state || ''}`.trim();

        return college?.name?.toLowerCase()?.includes(searchLower) ||
          locationStr?.toLowerCase()?.includes(searchLower) ||
          college?.branch?.toLowerCase()?.includes(searchLower) ||
          college?.district?.toLowerCase()?.includes(searchLower);
      });
    }

    // Apply filters
    if (filters?.probability?.length > 0) {
      filtered = filtered?.filter(college => {
        const prob = college?.admissionProbability;
        return filters?.probability?.some(p => {
          if (p === 'high') return prob >= 70;
          if (p === 'moderate') return prob >= 40 && prob < 70;
          if (p === 'low') return prob < 40;
          return false;
        });
      });
    }

    if (filters?.location?.length > 0) {
      filtered = filtered?.filter(college => {
        const locationStr = typeof college?.location === 'string'
          ? college.location.toLowerCase()
          : college?.location?.state?.toLowerCase() || '';
        return filters?.location?.some(loc => locationStr?.includes(loc?.toLowerCase()));
      });
    }

    if (filters?.collegeType?.length > 0) {
      filtered = filtered?.filter(college =>
        filters?.collegeType?.includes(college?.collegeType)
      );
    }

    if (filters?.feesMin) {
      filtered = filtered?.filter(college => {
        const fees = college?.fees?.annualTuitionFee || college?.fees || 0;
        return fees >= parseInt(filters?.feesMin);
      });
    }

    if (filters?.feesMax) {
      filtered = filtered?.filter(college => {
        const fees = college?.fees?.annualTuitionFee || college?.fees || 0;
        return fees <= parseInt(filters?.feesMax);
      });
    }

    if (filters?.rankingMin) {
      filtered = filtered?.filter(college => {
        const rank = college?.rankings?.nirf || college?.nirfRank;
        return rank && rank >= parseInt(filters?.rankingMin);
      });
    }

    if (filters?.rankingMax) {
      filtered = filtered?.filter(college => {
        const rank = college?.rankings?.nirf || college?.nirfRank;
        return rank && rank <= parseInt(filters?.rankingMax);
      });
    }

    if (filters?.packageMin) {
      filtered = filtered?.filter(college => {
        let pkg = college?.placements?.averagePackage || college?.averagePackage || 0;
        if (pkg > 0 && pkg < 10000) pkg *= 100000;
        return pkg >= parseInt(filters?.packageMin) * 100000;
      });
    }

    if (filters?.packageMax) {
      filtered = filtered?.filter(college => {
        let pkg = college?.placements?.averagePackage || college?.averagePackage || 0;
        if (pkg > 0 && pkg < 10000) pkg *= 100000;
        return pkg <= parseInt(filters?.packageMax) * 100000;
      });
    }

    // Apply sorting
    filtered?.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'probability':
          aValue = a?.admissionProbability;
          bValue = b?.admissionProbability;
          break;
        case 'ranking':
          aValue = a?.rankings?.nirf || a?.nirfRank || 9999;
          bValue = b?.rankings?.nirf || b?.nirfRank || 9999;
          break;
        case 'fees':
          aValue = a?.fees?.annualTuitionFee || a?.fees || 0;
          bValue = b?.fees?.annualTuitionFee || b?.fees || 0;
          break;
        case 'package':
          aValue = a?.placements?.averagePackage || a?.averagePackage || 0;
          bValue = b?.placements?.averagePackage || b?.averagePackage || 0;
          break;
        case 'alphabetical':
          aValue = a?.name?.toLowerCase();
          bValue = b?.name?.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredColleges(filtered);
  }, [colleges, searchTerm, filters, sortBy, sortOrder]);

  // Calculate stats
  const stats = {
    totalColleges: filteredColleges?.length,
    averageFees: filteredColleges?.reduce((sum, college) => {
      const fees = college?.fees?.annualTuitionFee || college?.fees || 0;
      return sum + fees;
    }, 0) / filteredColleges?.length || 0,
    averagePackage: filteredColleges?.reduce((sum, college) => {
      let pkg = college?.placements?.averagePackage || college?.averagePackage || 0;
      if (pkg > 0 && pkg < 10000) pkg *= 100000;
      return sum + pkg;
    }, 0) / (filteredColleges?.length || 1),
    distribution: {
      high: filteredColleges?.filter(c => c?.admissionProbability >= 70)?.length,
      moderate: filteredColleges?.filter(c => c?.admissionProbability >= 40 && c?.admissionProbability < 70)?.length,
      low: filteredColleges?.filter(c => c?.admissionProbability < 40)?.length
    }
  };

  // Event handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortBy, newSortOrder = sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleCollegeSelect = (collegeId, selected) => {
    if (selected) {
      setSelectedColleges(prev => [...prev, collegeId]);
    } else {
      setSelectedColleges(prev => prev?.filter(id => id !== collegeId));
    }
  };

  const handleSelectAll = () => {
    setSelectedColleges(filteredColleges?.map(c => c?._id || c?.id));
  };

  const handleClearSelection = () => {
    setSelectedColleges([]);
  };

  const handleBookmark = async (collegeId, bookmarked) => {
    // Find college object for bookmark data
    const college = filteredColleges.find(c => (c._id || c.id) === collegeId);
    
    if (bookmarked && college) {
      const bookmarkData = {
        collegeId,
        collegeName: college.name,
        listId: 'predicted',
        type: 'predicted',
        predictionData: {
          probability: college.admissionProbability,
          category: predictionData?.category,
          cutoff: college.previousCutoff,
          fees: college.fees,
          placement: college.placements,
          cetDetails: {
            examType: predictionData?.examType,
            rank: predictionData?.rank,
            category: predictionData?.category,
            branch: college.branch,
          },
        },
        dateAdded: new Date().toISOString(),
      };

      try {
        if (isValidObjectId(collegeId)) {
          await authAPI.addBookmark(bookmarkData);
        }
      } catch (error) {
        console.error(`Failed to bookmark college: ${college.name}`, error);
      }
    } else if (!bookmarked && college) {
      try {
        if (isValidObjectId(collegeId)) {
          await authAPI.removeBookmark({ collegeId });
        }
      } catch (error) {
        console.error(`Failed to remove bookmark: ${college.name}`, error);
      }
    }

    setColleges(prev => prev?.map(college =>
      (college?._id || college?.id) === collegeId ? { ...college, isBookmarked: bookmarked } : college
    ));
  };

  const handleBulkBookmark = async () => {
    if (!selectedColleges || selectedColleges.length === 0) return;

    // Find the actual college objects from filtered colleges
    const collegesToBookmark = selectedColleges.map(id => 
      filteredColleges?.find(c => (c._id || c.id) === id)
    ).filter(Boolean);

    let successCount = 0;
    
    // Bookmark in database
    for (const college of collegesToBookmark) {
      const collegeId = college._id || college.id;
      if (!collegeId) continue;

      const bookmarkData = {
        collegeId,
        collegeName: college.name,
        listId: 'predicted',
        type: 'predicted',
        predictionData: {
          probability: college.admissionProbability,
          category: predictionData?.category,
          cutoff: college.previousCutoff,
          fees: college.fees,
          placement: college.placements,
          cetDetails: {
            examType: predictionData?.examType,
            rank: predictionData?.rank,
            category: predictionData?.category,
            branch: college.branch,
          },
        },
        dateAdded: new Date().toISOString(),
      };

      try {
        if (isValidObjectId(collegeId)) {
          await authAPI.addBookmark(bookmarkData);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to bookmark college: ${college.name}`, error);
      }
    }

    // Update local state for UI feedback
    setColleges(prev => prev?.map(college =>
      selectedColleges?.includes(college?._id || college?.id) ? { ...college, isBookmarked: true } : college
    ));

    if (successCount > 0) {
      alert(`${successCount} colleges added to bookmarks successfully!`);
    } else if (collegesToBookmark.length > 0) {
      alert('Failed to add colleges to bookmarks. Please ensure you are logged in.');
    }
  };

  const handleCompare = (collegeId) => {
    // Find the actual college object from filtered colleges
    const college = filteredColleges?.find(c => (c._id || c.id) === collegeId);
    if (college) {
      // Store in unique sessionStorage key for prediction-results comparisons
      sessionStorage.setItem('comparisonColleges_prediction', JSON.stringify([college]));
      navigate('/college-details-comparison', {
        state: { colleges: [college], source: 'prediction' }
      });
    }
  };

  const handleBulkCompare = () => {
    if (selectedColleges?.length <= 4) {
      // Find the actual college objects from the filtered colleges
      const collegesToCompare = selectedColleges?.map(collegeId =>
        filteredColleges?.find(c => (c._id || c.id) === collegeId)
      ).filter(Boolean);

      if (collegesToCompare.length > 0) {
        // Store in unique sessionStorage key for prediction-results comparisons
        console.log('Storing colleges for comparison:', collegesToCompare);
        console.log('Number of colleges being stored:', collegesToCompare.length);
        sessionStorage.setItem('comparisonColleges_prediction', JSON.stringify(collegesToCompare));
        navigate('/college-details-comparison', {
          state: { colleges: collegesToCompare, source: 'prediction' }
        });
      }
    }
  };

  const handleViewDetails = (collegeId) => {
    // Prefer using college data we already have from prediction results (works for NEET, IIT Advanced, JEE).
    // Backend getCollegeById may only have JEE colleges, so passing collegeData avoids "College not found".
    const college = (filteredColleges.length ? filteredColleges : colleges).find(
      c => (c._id || c.id) == collegeId || String(c._id || c.id) === String(collegeId)
    );
    if (college) {
      setCollegeDetailsModal({ open: true, collegeId: null, collegeData: college });
      return;
    }
    // Fallback: fetch by ID (e.g. when college not in current results)
    const isValidObjectId = (id) => {
      if (!id) return false;
      const idStr = String(id);
      return /^[0-9a-fA-F]{24}$/.test(idStr);
    };
    if (isValidObjectId(collegeId)) {
      setCollegeDetailsModal({ open: true, collegeId });
    } else {
      alert('College details not available. This college may not be in the database yet.');
    }
  };

  const handleExport = async (exportData) => {
    const { format, colleges = [], includeDetails } = exportData || {};

    // Fallback: if no explicit selection was passed in, export all currently filtered colleges
    const exportColleges = colleges.length ? colleges : filteredColleges;

    if (!exportColleges.length) {
      alert('No colleges available to export.');
      return;
    }

    // Build a simple text representation: college + branch list
    const lines = [];
    lines.push('College Prediction Results');
    if (predictionData?.examType) {
      lines.push(`Exam: ${predictionData.examType}`);
    }
    if (predictionData?.rank) {
      lines.push(`Rank: ${predictionData.rank}`);
    }
    if (predictionData?.category) {
      lines.push(`Category: ${predictionData.category}`);
    }
    lines.push('');

    exportColleges.forEach((college, index) => {
      const name = college?.name || college?.collegeName || 'Unknown College';
      const branch = college?.branch || (college?.availableBranches || [])[0] || 'N/A';
      const locationStr =
        typeof college?.location === 'string'
          ? college.location
          : `${college?.location?.city || ''}, ${college?.location?.state || ''}`.trim();

      lines.push(`${index + 1}. ${name}`);
      lines.push(`   Branch: ${branch}`);
      if (locationStr) {
        lines.push(`   Location: ${locationStr}`);
      }
      if (includeDetails?.cutoffs && (college?.previousCutoff || college?.predictedCutoff)) {
        lines.push(
          `   Cutoff: ${college?.previousCutoff || college?.predictedCutoff}`
        );
      }
      lines.push('');
    });

    const content = lines.join('\n');

    // For now, we generate a simple PDF-like file using a text blob with .pdf extension.
    // This keeps the implementation lightweight and works in all browsers.
    const mimeType =
      format === 'excel'
        ? 'text/csv'
        : 'text/plain';
    const filename =
      format === 'excel'
        ? 'colleges_export.csv'
        : 'colleges_list.txt';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Increment reports downloaded count in database for dashboard statistics
    try {
      const response = await authAPI.incrementReportsDownloaded();
      if (response.data.success && user && updateUser) {
        updateUser({
          ...user,
          statistics: response.data.statistics
        });
      }
    } catch (error) {
      console.error('Failed to update reports downloaded count:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!filteredColleges || filteredColleges.length === 0) {
      setEmailStatus({ type: 'error', message: 'No colleges found to include in the report' });
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      setEmailStatus({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const predictionId = urlParams.get('id');

    if (!predictionId) {
      setEmailStatus({ type: 'error', message: 'No prediction data found to send' });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const response = await predictionAPI.sendEmail({
        email: emailInput,
        predictionId
      });

      if (response.data.success) {
        setEmailStatus({ 
          type: 'success', 
          message: `Report sent to ${emailInput}! Check your inbox.` 
        });
        // Clear success message after 5 seconds
        setTimeout(() => setEmailStatus({ type: null, message: '' }), 5000);
      } else {
        throw new Error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus({ 
        type: 'error', 
        message: 'Failed to send email. Please try again later.' 
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const allSelected = selectedColleges?.length === filteredColleges?.length && filteredColleges?.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {/* Prediction Summary */}
          {predictionData && (
            <PredictionSummary
              predictionData={predictionData}
              isCollapsed={summaryCollapsed}
              onToggle={() => setSummaryCollapsed(!summaryCollapsed)}
            />
          )}

          {!predictionData && !loading && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6 text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {noResultsMessage
                  ? 'No Colleges Match Your Preferences'
                  : 'No Prediction Results'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {noResultsMessage ||
                  'Please run a prediction first to see results here.'}
              </p>
              <Button
                onClick={() => navigate('/college-prediction-engine')}
                iconName="Target"
                iconPosition="left"
              >
                Get Predictions
              </Button>
            </div>
          )}

          <div className="flex gap-6">
            {/* Filter Panel - Desktop Sidebar */}
            <FilterSortPanel
              isOpen={filterPanelOpen}
              onClose={() => setFilterPanelOpen(false)}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Search Bar */}
              <SearchBar
                onSearch={handleSearch}
                onFilterToggle={() => setFilterPanelOpen(true)}
                placeholder="Search colleges by name, location, or branch..."
              />

              {/* Email Report Section */}
              <div className={`bg-card border border-border rounded-xl p-4 mb-6 shadow-sm transition-opacity ${filteredColleges.length === 0 ? 'opacity-50' : ''}`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon name="Mail" className="text-primary" size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Email this Report</h4>
                      <p className="text-xs text-muted-foreground">Get a PDF-style report sent to your inbox</p>
                    </div>
                  </div>
                  <div className="flex w-full md:w-auto items-center space-x-2">
                    <div className="relative flex-1 md:w-64">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your email"
                        disabled={filteredColleges.length === 0}
                        className="w-full pl-3 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-smooth disabled:cursor-not-allowed"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSendEmail}
                      loading={isSendingEmail}
                      disabled={filteredColleges.length === 0}
                      iconName="Send"
                      iconPosition="right"
                    >
                      Send
                    </Button>
                    <div className="h-8 w-px bg-border mx-1 hidden md:block"></div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport({ format: 'pdf', includeDetails: { cutoffs: true } })}
                      disabled={filteredColleges.length === 0}
                      iconName="Download"
                      iconPosition="left"
                      className="hidden md:flex"
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
                {emailStatus.message && (
                  <div className={`mt-3 text-xs font-medium px-3 py-2 rounded-lg flex items-center space-x-2 ${
                    emailStatus.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    <Icon name={emailStatus.type === 'success' ? 'CheckCircle2' : 'AlertCircle'} size={14} />
                    <span>{emailStatus.message}</span>
                  </div>
                )}
                {/* Mobile Download Button */}
                <div className="md:hidden mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleExport({ format: 'pdf', includeDetails: { cutoffs: true } })}
                      disabled={filteredColleges.length === 0}
                      iconName="Download"
                      iconPosition="left"
                    >
                      Download Report PDF
                    </Button>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              <BulkActionsToolbar
                selectedCount={selectedColleges?.length}
                totalCount={filteredColleges?.length}
                allSelected={allSelected}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onBulkBookmark={handleBulkBookmark}
                onBulkCompare={handleBulkCompare}
                onBulkExport={() => setExportModalOpen(true)}
              />

              {/* View Toggle and Stats Summary */}
              <div className="flex items-center justify-between mb-4">
                <StatsSummary stats={stats} />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-smooth ${viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    title="Grid View"
                  >
                    <Icon name="Grid" size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-smooth ${viewMode === 'map'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    title="Map View"
                  >
                    <Icon name="MapPin" size={20} />
                  </button>
                </div>
              </div>

              {/* Results Grid or Map View */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading results...</p>
                </div>
              ) : viewMode === 'map' ? (
                <MapView
                  colleges={filteredColleges}
                  onViewDetails={(id) => handleViewDetails(id)}
                />
              ) : (
                <div className="space-y-10">
                  {/* Recommended Section */}
                  {filteredColleges.filter(c => c.admissionProbability >= 80).length > 0 && (
                    <section>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="Sparkles" className="text-primary" size={24} />
                        </div>
                        <div>
                          <h2 className="font-heading font-bold text-2xl text-foreground">
                            Recommended Colleges for You
                          </h2>
                          <p className="text-sm text-muted-foreground">Top matches based on your preferences and rank</p>
                        </div>
                      </div>
                      <ResultsGrid
                        colleges={filteredColleges.filter(c => c.admissionProbability >= 80).slice(0, 6)}
                        selectedColleges={selectedColleges}
                        onCollegeSelect={handleCollegeSelect}
                        onBookmark={handleBookmark}
                        onViewDetails={handleViewDetails}
                      />
                    </section>
                  )}

                  {/* All Results Section */}
                  <section>
                    <div className="flex items-center space-x-3 mb-6 pt-6 border-t border-border">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Icon name="LayoutGrid" className="text-muted-foreground" size={20} />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-xl text-foreground">
                          All Prediction Results
                        </h3>
                        <p className="text-sm text-muted-foreground">Complete list of colleges matching your criteria</p>
                      </div>
                    </div>
                    <ResultsGrid
                      colleges={filteredColleges}
                      selectedColleges={selectedColleges}
                      onCollegeSelect={handleCollegeSelect}
                      onBookmark={handleBookmark}
                      onViewDetails={handleViewDetails}
                    />
                  </section>
                </div>
              )}

              {/* Comparison Bar */}
              <ComparisonBar
                selectedColleges={selectedColleges.map(id => filteredColleges.find(c => (c._id || c.id) === id)).filter(Boolean)}
                onRemoveCollege={(collegeId) => {
                  setSelectedColleges(prev => prev?.filter(id => id !== collegeId));
                }}
                onClearAll={() => setSelectedColleges([])}
                onBookmark={handleBulkBookmark}
              />

              {/* Pagination would go here for large datasets */}
              {filteredColleges?.length > 0 && !loading && predictionData && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredColleges?.length} of {predictionData?.totalColleges} colleges
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Modals */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        selectedColleges={
          selectedColleges?.length
            ? selectedColleges
              .map(id => filteredColleges?.find(c => c?.id === id))
              .filter(Boolean)
            : filteredColleges
        }
        onExport={handleExport}
      />
      <CollegeDetailsModal
        collegeId={collegeDetailsModal?.collegeId}
        collegeData={collegeDetailsModal?.collegeData}
        isOpen={collegeDetailsModal?.open}
        onClose={() => setCollegeDetailsModal({ open: false, collegeId: null, collegeData: null })}
        comparisonMode={true}
      />
    </div>
  );
};

export default PredictionResultsReports;