import React from 'react';
import Select from '../../../components/ui/Select';

const RoundSelector = ({ selectedRound, onRoundChange, examType, error, className = "" }) => {
  // Show for JEE Advanced and JEE Main
  const isJEEAdvanced = examType === 'JEE Advanced';
  const isJEEMain = examType === 'JEE Main';
  
  if (!isJEEAdvanced && !isJEEMain) {
    return null;
  }

  const roundOptions = [
    { value: '1', label: 'Round 1', description: 'First round cutoff' },
    { value: '2', label: 'Round 2', description: 'Second round cutoff' },
    { value: '3', label: 'Round 3', description: 'Third round cutoff' },
    { value: '4', label: 'Round 4', description: 'Fourth round cutoff' },
    { value: '5', label: 'Round 5', description: 'Fifth round cutoff' },
    { value: '6', label: 'Round 6', description: 'Final round cutoff (closing rank)' },
  ];

  const getDescription = () => {
    if (isJEEAdvanced) {
      return 'Select the JEE Advanced round for prediction (Round 6 shows final closing ranks)';
    } else if (isJEEMain) {
      return 'Select the JEE Main round for prediction (Round 6 shows final closing ranks, default if not selected)';
    }
    return 'Select round for prediction';
  };

  return (
    <div className={className}>
      <Select
        label="Select Round"
        description={getDescription()}
        options={roundOptions}
        value={selectedRound}
        onChange={onRoundChange}
        placeholder="Select round (1-6)"
        required={isJEEAdvanced} // Required for JEE Advanced, optional for JEE Main (defaults to 6)
        searchable={false}
        error={error}
      />
    </div>
  );
};

export default RoundSelector;
