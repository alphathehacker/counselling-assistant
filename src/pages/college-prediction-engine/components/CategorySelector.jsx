import React, { useEffect, useState } from 'react';
import Select from '../../../components/ui/Select';
import { predictionAPI } from '../../../utils/api';

const CategorySelector = ({ selectedCategory, onCategoryChange, examType, className = "" }) => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examType) {
      setCategoryOptions([]);
      return;
    }

    setLoading(true);
    predictionAPI
      .getCategories(examType)
      .then((response) => {
        if (response.data?.success && Array.isArray(response.data.categories)) {
          setCategoryOptions(
            response.data.categories.map((cat) => ({
              value: cat.value,
              label: cat.label,
              description: cat.description,
            }))
          );
        } else {
          setCategoryOptions([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching categories for', examType, ':', error);
        setCategoryOptions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [examType]);

  return (
    <div className={className}>
      <Select
        label="Select Category"
        description={
          loading
            ? 'Loading categories...'
            : 'Select your reservation category (matches exam CSV format)'
        }
        options={categoryOptions}
        value={selectedCategory}
        onChange={onCategoryChange}
        placeholder={
          loading
            ? 'Loading categories...'
            : categoryOptions.length === 0
            ? 'No categories available for this exam'
            : 'Select category'
        }
        required
        searchable
        loading={loading}
        disabled={!examType || loading}
      />
    </div>
  );
};

export default CategorySelector;