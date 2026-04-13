import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import { predictionAPI } from '../../../utils/api';

const BranchSelector = ({ selectedBranches, onBranchChange, examType, selectedLocations = [], className = "" }) => {
  const [branchOptions, setBranchOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examType) {
      setLoading(true);
      // For JEE Advanced, pass selected locations to filter branches by state
      const isJEEAdvanced = examType === 'JEE Advanced';
      const params = {};
      if (isJEEAdvanced && selectedLocations && selectedLocations.length > 0) {
        params.locations = selectedLocations;
      }
      
      predictionAPI.getBranches(examType, params)
        .then(response => {
          console.log('Branches API response for', examType, ':', response.data);
          if (response.data.success) {
            // Convert branches to options format (match CSV branch codes like CSE, ECE, etc.)
            const options = response.data.branches.map(branch => ({
              value: branch,
              label: branch.toUpperCase(), // Display in uppercase to match CSV
            }));
            console.log('Branch options:', options);
            setBranchOptions(options);
          } else {
            console.warn('Branches API returned success=false:', response.data);
            setBranchOptions([]);
          }
        })
        .catch(error => {
          console.error('Error fetching branches for', examType, ':', error);
          console.error('Error details:', error.response?.data || error.message);
          // Don't use fallback - show empty list so user knows data is needed
          setBranchOptions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setBranchOptions([]);
    }
  }, [examType, selectedLocations]);

  return (
    <div className={className}>
      <Select
        label="Select Branch"
        description={loading ? "Loading branches..." : examType === 'JEE Advanced' && selectedLocations.length > 0 
          ? `Select branch/course available in ${selectedLocations.join(', ')} (multiple selection allowed)`
          : "Select branch/course (matches CSV branch codes, multiple selection allowed)"}
        options={branchOptions}
        value={selectedBranches || []}
        onChange={onBranchChange}
        placeholder={loading ? "Loading branches..." : (branchOptions.length === 0 && examType ? "No branches found for this exam. Please upload CSV data first." : "Select branch(es)")}
        multiple={true} // Python logic supports multiple branches
        searchable
        clearable
        loading={loading}
        disabled={loading || !examType}
      />
    </div>
  );
};

export default BranchSelector;