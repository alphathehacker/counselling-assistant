import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionsToolbar = ({ 
  selectedCount, 
  onSelectAll, 
  onClearSelection, 
  onBulkBookmark, 
  onBulkCompare, 
  onBulkExport,
  totalCount,
  allSelected 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-primary" />
            <span className="font-medium text-foreground">
              {selectedCount} college{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? onClearSelection : onSelectAll}
            >
              {allSelected ? 'Deselect All' : `Select All (${totalCount})`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              Clear Selection
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkBookmark}
            iconName="Bookmark"
            iconPosition="left"
          >
            Bookmark
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkCompare}
            iconName="GitCompare"
            iconPosition="left"
            disabled={selectedCount > 4}
          >
            Compare {selectedCount > 4 && '(Max 4)'}
          </Button>
          
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBulkExport}
              iconName="Download"
              iconPosition="left"
            >
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;