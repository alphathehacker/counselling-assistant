import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';

const ExportModal = ({ isOpen, onClose, selectedColleges, onExport }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeFields, setIncludeFields] = useState({
    basicInfo: true,
    fees: true,
    cutoffs: true,
    placements: true,
    notes: true,
    tags: true,
    probability: true
  });
  const [sortBy, setSortBy] = useState('name');
  const [includeCharts, setIncludeCharts] = useState(true);

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV File' }
  ];

  const sortOptions = [
    { value: 'name', label: 'College Name' },
    { value: 'probability', label: 'Admission Probability' },
    { value: 'fees', label: 'Fees' },
    { value: 'ranking', label: 'NIRF Ranking' }
  ];

  const handleFieldChange = (field, checked) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleExport = () => {
    const exportConfig = {
      format: exportFormat,
      fields: includeFields,
      sortBy,
      includeCharts: includeCharts && exportFormat === 'pdf',
      colleges: selectedColleges
    };
    
    onExport(exportConfig);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-400 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-lg shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading font-semibold text-lg text-foreground">
            Export Bookmarks
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <Select
              label="Export Format"
              options={formatOptions}
              value={exportFormat}
              onChange={setExportFormat}
            />
          </div>

          {/* Sort Order */}
          <div>
            <Select
              label="Sort Colleges By"
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>

          {/* Include Fields */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-3">
              Include Information
            </label>
            <div className="space-y-2">
              <Checkbox
                label="Basic Information (Name, Location, Type)"
                checked={includeFields?.basicInfo}
                onChange={(e) => handleFieldChange('basicInfo', e?.target?.checked)}
              />
              <Checkbox
                label="Fees Structure"
                checked={includeFields?.fees}
                onChange={(e) => handleFieldChange('fees', e?.target?.checked)}
              />
              <Checkbox
                label="Cutoff Ranks"
                checked={includeFields?.cutoffs}
                onChange={(e) => handleFieldChange('cutoffs', e?.target?.checked)}
              />
              <Checkbox
                label="Placement Statistics"
                checked={includeFields?.placements}
                onChange={(e) => handleFieldChange('placements', e?.target?.checked)}
              />
              <Checkbox
                label="Admission Probability"
                checked={includeFields?.probability}
                onChange={(e) => handleFieldChange('probability', e?.target?.checked)}
              />
              <Checkbox
                label="Personal Notes"
                checked={includeFields?.notes}
                onChange={(e) => handleFieldChange('notes', e?.target?.checked)}
              />
              <Checkbox
                label="Custom Tags"
                checked={includeFields?.tags}
                onChange={(e) => handleFieldChange('tags', e?.target?.checked)}
              />
            </div>
          </div>

          {/* PDF Options */}
          {exportFormat === 'pdf' && (
            <div>
              <Checkbox
                label="Include Charts and Graphs"
                description="Add visual comparisons and statistics"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e?.target?.checked)}
              />
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-primary" />
              <span className="font-medium text-sm text-foreground">Export Summary</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{selectedColleges?.length} college{selectedColleges?.length > 1 ? 's' : ''} selected</p>
              <p>Format: {formatOptions?.find(f => f?.value === exportFormat)?.label}</p>
              <p>Fields: {Object.values(includeFields)?.filter(Boolean)?.length} included</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            iconName="Download"
            iconPosition="left"
            iconSize={16}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExportModal;