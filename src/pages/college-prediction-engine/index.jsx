import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ExamTypeSelector from './components/ExamTypeSelector';
import RankInput from './components/RankInput';
import CategorySelector from './components/CategorySelector';
import RoundSelector from './components/RoundSelector';
import LocationSelector from './components/LocationSelector';
import BranchSelector from './components/BranchSelector';
import GenderSelector from './components/GenderSelector';
import InstituteGroupSelector from './components/InstituteGroupSelector';
import AdvancedFilters from './components/AdvancedFilters';
import ProgressIndicator from './components/ProgressIndicator';
import PredictionResults from './components/PredictionResults';
import { useAuth } from '../../context/AuthContext';

const CollegePredictionEngine = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    examType: '',
    rank: '',
    category: '',
    round: '', // For JEE Advanced: round 1-6
    gender: 'Gender-Neutral', // For JEE Main: Gender-Neutral | Female-only | All
    locations: [], // Used as state/district filter
    branches: [], // Multiple branches allowed
    instituteGroups: [], // For JEE Main: NIT / IIIT / GFTI (empty = all)
  });

  const [filters, setFilters] = useState({});
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [predictionParams, setPredictionParams] = useState(null);

  // Dynamic steps based on exam type
  const getSteps = () => {
    const baseSteps = [
      { id: 'exam', title: 'Select Exam', description: 'Choose your entrance exam' },
      { id: 'rank', title: 'Enter Rank', description: 'Provide your exam rank/percentile' },
      { id: 'category', title: 'Select Category', description: 'Choose your reservation category' },
    ];

    // Add round step for JEE Advanced and JEE Main
    const isJEEAdvanced = formData?.examType === 'JEE Advanced';
    const isJEEMain = formData?.examType === 'JEE Main';
    if (isJEEAdvanced) {
      baseSteps.push({ id: 'round', title: 'Select Round', description: 'Choose JEE Advanced round (1-6)' });
    } else if (isJEEMain) {
      baseSteps.push({ id: 'round', title: 'Select Round', description: 'Choose JEE Main round (1-6, optional, defaults to Round 6)' });
    }

    baseSteps.push(
      { id: 'location', title: 'Preferred Locations', description: 'Select preferred study locations' },
      { id: 'branches', title: 'Preferred Branches', description: 'Choose your preferred courses' }
    );

    return baseSteps;
  };

  const steps = getSteps();

  // Mock prediction data
  const mockPredictions = [
    {
      id: 1,
      name: 'Indian Institute of Technology Delhi',
      location: 'New Delhi, Delhi',
      type: 'Government',
      ranking: 2,
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
      probability: 'high',
      previousCutoff: '164',
      fees: 200000,
      averagePackage: 1800000,
      distance: 25,
      availableBranches: ['Computer Science Engineering', 'Electronics & Communication', 'Mechanical Engineering'],
      isBookmarked: false
    },
    {
      id: 2,
      name: 'National Institute of Technology Warangal',
      location: 'Warangal, Telangana',
      type: 'Government',
      ranking: 19,
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
      probability: 'high',
      previousCutoff: '1250',
      fees: 150000,
      averagePackage: 1400000,
      distance: 150,
      availableBranches: ['Computer Science Engineering', 'Electrical Engineering', 'Civil Engineering'],
      isBookmarked: true
    },
    {
      id: 3,
      name: 'Birla Institute of Technology and Science Pilani',
      location: 'Pilani, Rajasthan',
      type: 'Private',
      ranking: 25,
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400',
      probability: 'medium',
      previousCutoff: '2100',
      fees: 450000,
      averagePackage: 1600000,
      distance: 280,
      availableBranches: ['Computer Science Engineering', 'Electronics & Instrumentation', 'Chemical Engineering'],
      isBookmarked: false
    },
    {
      id: 4,
      name: 'Vellore Institute of Technology',
      location: 'Vellore, Tamil Nadu',
      type: 'Private',
      ranking: 15,
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400',
      probability: 'medium',
      previousCutoff: '3500',
      fees: 350000,
      averagePackage: 1200000,
      distance: 420,
      availableBranches: ['Information Technology', 'Computer Science Engineering', 'Electronics Engineering'],
      isBookmarked: false
    },
    {
      id: 5,
      name: 'Manipal Institute of Technology',
      location: 'Manipal, Karnataka',
      type: 'Private',
      ranking: 45,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      probability: 'low',
      previousCutoff: '5200',
      fees: 400000,
      averagePackage: 1100000,
      distance: 650,
      availableBranches: ['Computer Science Engineering', 'Information Technology', 'Mechanical Engineering'],
      isBookmarked: false
    }
  ];

  useEffect(() => {
    // Calculate current step based on form completion
    let step = 1;
    if (formData?.examType) step = 2;
    if (formData?.examType && formData?.rank) step = 3;
    if (formData?.examType && formData?.rank && formData?.category) step = 4;
    // For JEE Advanced, require round selection; JEE Main round is optional
    const isJEEAdvanced = formData?.examType === 'JEE Advanced';
    const isJEEMain = formData?.examType === 'JEE Main';
    if (formData?.examType && formData?.rank && formData?.category) {
      if (isJEEAdvanced && !formData?.round) {
        step = 4; // Stay on step 4 until round is selected
      } else {
        step = 5; // JEE Main can proceed without round (will default to 6)
      }
    }
    if (formData?.examType && formData?.rank && formData?.category &&
      (!isJEEAdvanced || formData?.round) && formData?.locations?.length > 0) step = 6;
    if (formData?.examType && formData?.rank && formData?.category &&
      (!isJEEAdvanced || formData?.round) && formData?.locations?.length > 0 && formData?.branches?.length > 0) step = 7;

    setCurrentStep(step);
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.examType) {
      newErrors.examType = 'Please select an entrance exam';
    }

    if (!formData?.rank) {
      newErrors.rank = 'Please enter your rank/percentile';
    } else {
      const rank = parseFloat(formData?.rank);
      if (formData?.examType === 'cat') {
        if (rank < 0 || rank > 100) {
          newErrors.rank = 'CAT percentile must be between 0 and 100';
        }
      } else if (rank < 1) {
        newErrors.rank = 'Rank must be greater than 0';
      }
    }

    if (!formData?.category) {
      newErrors.category = 'Please select your category';
    }

    // For JEE Advanced, round is required; JEE Main round is optional (defaults to 6)
    const isJEEAdvanced = formData?.examType === 'JEE Advanced';
    const isJEEMain = formData?.examType === 'JEE Main';
    if (isJEEAdvanced && !formData?.round) {
      newErrors.round = 'Please select a round (1-6)';
    }
    // JEE Main round is optional, no validation error needed

    if (formData?.locations?.length === 0) {
      newErrors.locations = 'Please select at least one preferred location';
    }

    if (formData?.branches?.length === 0) {
      newErrors.branches = 'Please select at least one preferred branch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleGeneratePredictions = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setShowResults(false);
    setErrors({});

    try {
      const { predictionAPI } = await import('../../utils/api');

      // Map filter keys to API expected keys
      const collegeTypeMap = {
        'government': 'Government',
        'private': 'Private',
        'deemed': 'Deemed University',
        'autonomous': 'Autonomous',
      };

      // Category should be in CSV column format (OC_BOYS, SC_BOYS, etc.)
      // This matches the Python logic where category is the column name
      // For JEE Main, default round to 6 if not provided
      const isJEEMain = formData.examType === 'JEE Main';
      const roundValue = formData.round || (isJEEMain ? '6' : null);

      const predictionData = {
        examType: formData.examType,
        rank: parseFloat(formData.rank),
        category: formData.category,
        round: roundValue, // For JEE Advanced: round 1-6 (required), JEE Main: round 1-6 (optional, defaults to 6)
        gender: formData.gender || 'Gender-Neutral',
        districts: formData.locations || [],
        preferredBranches: formData.branches || [],
        instituteGroups: formData.examType === 'JEE Main' ? (formData.instituteGroups || []) : [],
        // Advanced filters
        collegeType: filters.collegeType?.map(t => collegeTypeMap[t] || t) || [],
        feeMin: filters.feeMin ? parseFloat(filters.feeMin) : null,
        feeMax: filters.feeMax ? parseFloat(filters.feeMax) : null,
        maxDistance: filters.maxDistance ? parseFloat(filters.maxDistance) : null,
        minPackage: filters.minPackage ? parseFloat(filters.minPackage) : null,
        maxRanking: filters.maxRanking ? parseInt(filters.maxRanking) : null,
      };

      // Select API endpoint – use database-driven predict2 for AP exams
      const isAPExam = formData.examType === 'AP EAPCET' || formData.examType === 'AP ECET';
      console.log(`[DEBUG] ExamType="${formData.examType}", isAPExam=${isAPExam}`);
      
      const response = isAPExam 
        ? await predictionAPI.predict2(predictionData)
        : await predictionAPI.predict(predictionData);
      
      console.log(`[DEBUG] Prediction Response:`, response.data);



      if (response.data.success) {
        // Increment the user's totalPredictions locally so dashboard reflects it immediately
        if (user && updateUser) {
          updateUser({
            ...user,
            statistics: {
              ...user.statistics,
              totalPredictions: (user.statistics?.totalPredictions || 0) + 1
            }
          });
        }

        // Store prediction params for navigation to results page
        setPredictionParams(predictionData);

        // Use grouped results if available, otherwise use flat predictions
        const groupedResults = response.data.resultsGrouped || [];

        // Transform grouped results to flat list for backward compatibility
        const transformedPredictions = response.data.predictions.map((pred, index) => ({
          id: pred.id || index + 1,
          name: pred.name,
          shortName: pred.shortName,
          branch: (pred.branch || 'N/A').toUpperCase(),
          district: (pred.district || pred.location?.district || pred.location?.city || 'N/A').toUpperCase(),
          location: {
            city: pred.location?.city || '',
            state: pred.location?.state || '',
            district: pred.district || pred.location?.district || pred.location?.city || '',
          },
          gender: (pred.gender || 'COED').toUpperCase(),
          closingRank: pred.cutoffRank || null,
          cutoffRank: pred.cutoffRank || null,
          // Keep other fields for future use
          type: pred.collegeType,
          ranking: pred.rankings?.nirf || null,
          probability: pred.admissionChance,
          previousCutoff: pred.cutoffRank?.toString() || 'N/A',
          fees: pred.fees?.annualTuitionFee || 0,
          averagePackage: pred.placements?.averagePackage || 0,
          availableBranches: [pred.branch].filter(Boolean),
          confidence: pred.confidence,
          placements: pred.placements,
          facilities: pred.facilities || [],
          website: pred.website,
          isBookmarked: false,
        }));

        // Store both flat predictions and grouped results
        setPredictions({
          flat: transformedPredictions,
          grouped: groupedResults,
        });
        // Store user rank for probability calculation in explore page
        sessionStorage.setItem('userRank', formData.rank.toString());
        // Store prediction params for navigation to detailed results
        sessionStorage.setItem('predictionParams', JSON.stringify(predictionData));

        // Store prediction results in sessionStorage for immediate use
        sessionStorage.setItem('predictionResults', JSON.stringify({
          flat: response.data.predictions,
          grouped: groupedResults,
        }));

        // If predictionResultId is returned, navigate with it
        if (response.data.predictionResultId) {
          // Navigate to results page with the saved prediction ID
          navigate(`/prediction-results-reports?id=${response.data.predictionResultId}`, {
            state: { predictionResultId: response.data.predictionResultId }
          });
        } else {
          setShowResults(true);
        }
      } else {
        setErrors({ general: response.data.message || 'Failed to generate predictions' });
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setErrors({
        general: error.response?.data?.message || 'Failed to generate predictions. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBookmark = (collegeId) => {
    setPredictions(prev =>
      prev?.map(college =>
        college?.id === collegeId
          ? { ...college, isBookmarked: !college?.isBookmarked }
          : college
      )
    );
  };

  const handleViewDetails = (collegeId) => {
    // Navigate to college details or open modal
    console.log('View details for college:', collegeId);
  };

  // Form is complete when all required fields are filled
  // District (locations) and branches are required
  const isFormComplete = formData?.examType && formData?.rank && formData?.category &&
    formData?.locations?.length > 0 && formData?.branches?.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
            <Link to="/student-dashboard" className="hover:text-foreground transition-smooth">
              Dashboard
            </Link>
            <Icon name="ChevronRight" size={16} />
            <span className="text-foreground font-medium">New Prediction</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
              College Prediction Engine
            </h1>
            <p className="text-muted-foreground">
              Get personalized college recommendations based on your entrance exam performance and preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Panel */}
            <div className="lg:col-span-4 space-y-6">
              {/* Progress Indicator */}
              <ProgressIndicator
                currentStep={currentStep}
                totalSteps={steps?.length}
                steps={steps}
              />

              {/* Prediction Form */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Icon name="Target" size={20} className="text-primary" />
                  <h2 className="font-heading font-semibold text-lg text-foreground">
                    Prediction Parameters
                  </h2>
                </div>

                <ExamTypeSelector
                  selectedExam={formData?.examType}
                  onExamChange={(value) => setFormData(prev => ({
                    ...prev,
                    examType: value,
                    category: '',
                    round: '',
                    locations: [],
                    branches: [],
                    gender: 'Gender-Neutral',
                    instituteGroups: [],
                  }))}
                />

                {formData?.examType && (
                  <RankInput
                    rank={formData?.rank}
                    onRankChange={(value) => setFormData(prev => ({ ...prev, rank: value }))}
                    examType={formData?.examType}
                    error={errors?.rank}
                  />
                )}

                {formData?.examType && formData?.rank && (
                  <CategorySelector
                    selectedCategory={formData?.category}
                    onCategoryChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    examType={formData?.examType}
                  />
                )}

                {/* Round selector for JEE Advanced and JEE Main */}
                {((formData?.examType === 'JEE Advanced' || formData?.examType === 'JEE Main') &&
                  formData?.examType && formData?.rank && formData?.category) && (
                    <RoundSelector
                      selectedRound={formData?.round}
                      onRoundChange={(value) => setFormData(prev => ({ ...prev, round: value }))}
                      examType={formData?.examType}
                      error={errors?.round}
                    />
                  )}

                {formData?.examType && formData?.rank && formData?.category &&
                  ((formData?.examType === 'JEE Advanced' || formData?.examType === 'JEE Main')
                    ? (formData?.examType === 'JEE Main' ? true : formData?.round) // JEE Main round is optional, JEE Advanced requires it
                    : true) && (
                    <LocationSelector
                      selectedLocations={formData?.locations}
                      onLocationChange={(value) => setFormData(prev => ({ ...prev, locations: Array.isArray(value) ? value : (value ? [value] : []) }))}
                      examType={formData?.examType}
                    />
                  )}

                {/* Gender selector – JEE Main and JEE Advanced */}
                {(formData?.examType === 'JEE Main' || formData?.examType === 'JEE Advanced') && formData?.locations?.length > 0 && (
                  <GenderSelector
                    selectedGender={formData?.gender}
                    onGenderChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  />
                )}

                {/* Institute Group selector – JEE Main only */}
                {formData?.examType === 'JEE Main' && formData?.locations?.length > 0 && (
                  <InstituteGroupSelector
                    selectedGroups={formData?.instituteGroups}
                    onGroupChange={(value) => setFormData(prev => ({ ...prev, instituteGroups: value }))}
                  />
                )}

                {formData?.examType && formData?.rank && formData?.category && formData?.locations?.length > 0 && (
                  <BranchSelector
                    selectedBranches={formData?.branches}
                    onBranchChange={(value) => setFormData(prev => ({ ...prev, branches: value }))}
                    examType={formData?.examType}
                    selectedLocations={formData?.locations || []}
                  />
                )}
              </div>

              {/* Advanced Filters */}
              <AdvancedFilters
                filters={filters}
                onFiltersChange={setFilters}
              />

              {/* Generate Button */}
              <div className="sticky bottom-4 lg:static">
                <Button
                  onClick={handleGeneratePredictions}
                  disabled={!isFormComplete || isGenerating}
                  loading={isGenerating}
                  iconName="Zap"
                  iconPosition="left"
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? 'Generating Predictions...' : 'Generate Predictions'}
                </Button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-8">
              <PredictionResults
                results={showResults ? predictions : []}
                loading={isGenerating}
                onBookmark={handleBookmark}
                onViewDetails={handleViewDetails}
                userRank={formData.rank}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollegePredictionEngine;