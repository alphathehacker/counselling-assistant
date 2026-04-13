import React from 'react';
import Input from '../../../components/ui/Input';

const RankInput = ({ rank, onRankChange, examType, error, className = "" }) => {
  const getPlaceholder = () => {
    switch (examType) {
      case 'JEE Main':
        return 'Enter your JEE Main rank (e.g., 50000)';
      case 'JEE Advanced':
        return 'Enter your JEE Advanced rank (e.g., 5000)';
      case 'AP EAPCET':
        return 'Enter your AP EAPCET rank (e.g., 50000)';
      case 'AP ECET':
        return 'Enter your AP ECET rank (e.g., 50000)';
      case 'NEET':
        return 'Enter your NEET rank (1-1500000)';
      default:
        return 'Enter your rank';
    }
  };

  const getLabel = () => {
    return 'Enter Your Rank';
  };

  const getValidationProps = () => {
    const maxRanks = {
      'JEE Main': 1200000,
      'JEE Advanced': 40000,
      'AP EAPCET': 500000,
      'AP ECET': 100000,
      'NEET': 1500000,
    };

    return { min: 1, max: maxRanks?.[examType] || 1000000 };
  };

  return (
    <div className={className}>
      <Input
        type="number"
        label={getLabel()}
        placeholder={getPlaceholder()}
        value={rank}
        onChange={(e) => onRankChange(e?.target?.value)}
        error={error}
        required
        {...getValidationProps()}
      />
    </div>
  );
};

export default RankInput;