import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActions = ({ 
  selectedCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkRemove, 
  onBulkMove, 
  onBulkExport,
  onBulkShare,
  lists,
  totalCount
}) => {
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [targetList, setTargetList] = useState('');

  const listOptions = lists?.map(list => ({
    value: list?.id,
    label: list?.name
  }));

  const handleBulkMove = () => {
    if (targetList) {
      onBulkMove(targetList);
      setTargetList('');
      setShowMoveOptions(false);
    }
  };

  if (selectedCount === 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Icon name="Info" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Select colleges to perform bulk actions
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          iconName="CheckSquare"
          iconPosition="left"
          iconSize={14}
        >
          Select All ({totalCount})
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={16} className="text-primary" />
            <span className="font-medium text-foreground">
              {selectedCount} college{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Deselect All
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Move to List */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMoveOptions(!showMoveOptions)}
              iconName="FolderOpen"
              iconPosition="left"
              iconSize={14}
            >
              Move to List
            </Button>
            
            {showMoveOptions && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-modal z-50">
                <div className="p-3">
                  <Select
                    label="Select destination list"
                    options={listOptions}
                    value={targetList}
                    onChange={setTargetList}
                    placeholder="Choose a list"
                    className="mb-3"
                  />
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleBulkMove}
                      disabled={!targetList}
                    >
                      Move
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowMoveOptions(false);
                        setTargetList('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            iconName="Download"
            iconPosition="left"
            iconSize={14}
          >
            Export
          </Button>

          {/* Share */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkShare}
            iconName="Share"
            iconPosition="left"
            iconSize={14}
          >
            Share
          </Button>

          {/* Remove */}
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkRemove}
            iconName="Trash2"
            iconPosition="left"
            iconSize={14}
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Overlay to close move options */}
      {showMoveOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoveOptions(false)}
        />
      )}
    </div>
  );
};

export default BulkActions;