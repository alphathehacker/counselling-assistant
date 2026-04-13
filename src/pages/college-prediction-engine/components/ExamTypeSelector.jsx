import React from 'react';
import Select from '../../../components/ui/Select';

const ExamTypeSelector = ({ selectedExam, onExamChange, className = "" }) => {
  // Exam types must match backend: AP EAPCET, AP ECET, NEET, JEE Main, JEE Advanced
  const examOptions = [
    { value: 'JEE Main', label: 'JEE Main', description: 'Joint Entrance Examination - Main' },
    { value: 'JEE Advanced', label: 'JEE Advanced', description: 'Joint Entrance Examination - Advanced' },
    { value: 'AP EAPCET', label: 'AP EAPCET', description: 'Engineering, Agriculture & Pharmacy Common Entrance Test (Andhra Pradesh)' },
    { value: 'AP ECET', label: 'AP ECET', description: 'Engineering Common Entrance Test (Andhra Pradesh)' },
    { value: 'NEET', label: 'NEET', description: 'National Eligibility cum Entrance Test' },
  ];

  return (
    <div className={className}>
      <Select
        label="Select Entrance Exam"
        description="Choose the exam you appeared for"
        options={examOptions}
        value={selectedExam}
        onChange={onExamChange}
        placeholder="Select your exam"
        required
        searchable
      />
    </div>
  );
};

export default ExamTypeSelector;