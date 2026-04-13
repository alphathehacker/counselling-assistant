import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ComparisonBar = ({ 
  selectedColleges, 
  onRemoveCollege, 
  onClearAll, 
  onBookmark,
  maxSelections = 4,
  className = "" 
}) => {
  const navigate = useNavigate();

  if (selectedColleges?.length === 0) return null;

  const handleCompareNow = () => {
    if (selectedColleges?.length >= 2) {
      // Store in unique sessionStorage key for search-filter comparisons
      sessionStorage.setItem('comparisonColleges_search', JSON.stringify(selectedColleges));
      navigate('/college-details-comparison', { 
        state: { colleges: selectedColleges, source: 'search' } 
      });
    } else if (selectedColleges?.length === 1) {
      // Allow single college comparison (view details)
      sessionStorage.setItem('comparisonColleges_search', JSON.stringify(selectedColleges));
      navigate('/college-details-comparison', { 
        state: { colleges: selectedColleges, source: 'search' } 
      });
    }
  };

  return (
    <div className={`fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-6 lg:right-6 z-[100] ${className}`}>
      <div className="bg-card border border-border rounded-lg shadow-modal p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon name="GitCompare" size={20} className="text-primary" />
            <h3 className="font-heading font-medium text-foreground">
              Selected Colleges ({selectedColleges?.length}/{maxSelections})
            </h3>
          </div>
          
          <button
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {selectedColleges?.map((college) => (
              <div
                key={college?._id || college?.id || college?.name || Math.random()}
                className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg flex-shrink-0"
              >
                <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                  {college?.name}
                </span>
                <button
                  onClick={() => onRemoveCollege(college?._id || college?.id)}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="flex-1"
          >
            Clear All
          </Button>

          {onBookmark && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBookmark}
              iconName="Bookmark"
              iconPosition="left"
              className="flex-1"
            >
              Bookmark All
            </Button>
          )}
          
          <Button
            onClick={handleCompareNow}
            size="sm"
            disabled={selectedColleges?.length < 1}
            className="flex-1"
            iconName="GitCompare"
            iconPosition="left"
          >
             Compare Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;