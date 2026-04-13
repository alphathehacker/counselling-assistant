import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportModal = ({ isOpen, onClose, selectedColleges, onExport }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeDetails, setIncludeDetails] = useState({
    basicInfo: true,
    cutoffs: true,
    fees: true,
    placements: true,
    rankings: true
  });
  const [emailData, setEmailData] = useState({
    recipients: '',
    subject: 'College Prediction Results',
    message: 'Please find attached your personalized college prediction results.'
  });
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'email', label: 'Email Report' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    const exportData = {
      format: exportFormat,
      colleges: selectedColleges,
      includeDetails,
      ...(exportFormat === 'email' && { emailData })
    };

    try {
      await onExport(exportData);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDetailChange = (key, checked) => {
    setIncludeDetails(prev => ({
      ...prev,
      [key]: checked
    }));
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
          <h2 className="font-heading font-semibold text-xl text-foreground">
            Export Results
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
              placeholder="Select format"
            />
          </div>

          {/* Include Details */}
          <div>
            <label className="block font-heading font-medium text-sm text-foreground mb-3">
              Include Details
            </label>
            <div className="space-y-2">
              <Checkbox
                label="Basic Information"
                checked={includeDetails?.basicInfo}
                onChange={(e) => handleDetailChange('basicInfo', e?.target?.checked)}
              />
              <Checkbox
                label="Cutoff Data"
                checked={includeDetails?.cutoffs}
                onChange={(e) => handleDetailChange('cutoffs', e?.target?.checked)}
              />
              <Checkbox
                label="Fee Structure"
                checked={includeDetails?.fees}
                onChange={(e) => handleDetailChange('fees', e?.target?.checked)}
              />
              <Checkbox
                label="Placement Statistics"
                checked={includeDetails?.placements}
                onChange={(e) => handleDetailChange('placements', e?.target?.checked)}
              />
              <Checkbox
                label="Rankings"
                checked={includeDetails?.rankings}
                onChange={(e) => handleDetailChange('rankings', e?.target?.checked)}
              />
            </div>
          </div>

          {/* Email Options */}
          {exportFormat === 'email' && (
            <div className="space-y-4">
              <Input
                label="Recipients"
                type="email"
                placeholder="Enter email addresses (comma separated)"
                value={emailData?.recipients}
                onChange={(e) => setEmailData(prev => ({
                  ...prev,
                  recipients: e?.target?.value
                }))}
                required
              />
              
              <Input
                label="Subject"
                type="text"
                value={emailData?.subject}
                onChange={(e) => setEmailData(prev => ({
                  ...prev,
                  subject: e?.target?.value
                }))}
              />
              
              <div>
                <label className="block font-heading font-medium text-sm text-foreground mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  value={emailData?.message}
                  onChange={(e) => setEmailData(prev => ({
                    ...prev,
                    message: e?.target?.value
                  }))}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-heading font-medium text-sm text-foreground mb-2">
              Export Summary
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Colleges: {selectedColleges?.length}</p>
              <p>Format: {formatOptions?.find(f => f?.value === exportFormat)?.label}</p>
              <p>Details: {Object.values(includeDetails)?.filter(Boolean)?.length} sections</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            loading={isExporting}
            iconName="Download"
            iconPosition="left"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExportModal;