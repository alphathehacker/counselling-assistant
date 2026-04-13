import React, { useMemo } from 'react';
import Select from '../../../components/ui/Select';

// Exam types that use districts (AP exams)
const DISTRICT_BASED_EXAMS = ['AP EAPCET', 'AP ECET'];

// All 26 districts of Andhra Pradesh
const ANDHRA_PRADESH_DISTRICTS = [
  'Anantapur',
  'Chittoor',
  'East Godavari',
  'Guntur',
  'Kadapa',
  'Kurnool',
  'Krishna',
  'Nellore',
  'Prakasam',
  'Srikakulam',
  'Visakhapatnam',
  'Vizianagaram',
  'West Godavari',
  'Annamayya',
  'Bapatla',
  'Eluru',
  'Kakinada',
  'Konaseema',
  'Nandyal',
  'NTR District',
  'Palnadu',
  'Parvathipuram Manyam',
  'Rajamahendravaram',
  'Sri Potti Sriramulu Nellore',
  'Tirupati',
  'Alluri Sitarama Raju'
];

// IIT locations for JEE Advanced (all 23 IITs - matching backend)
const IIT_LOCATIONS = [
  'Indian Institute of Technology (BHU) Varanasi',
  'Indian Institute of Technology Bhilai',
  'Indian Institute of Technology Bhubaneswar',
  'Indian Institute of Technology Bombay',
  'Indian Institute of Technology Delhi', 
  'Indian Institute of Technology Dhanbad',
  'Indian Institute of Technology Dharwad',
  'Indian Institute of Technology Gandhinagar',
  'Indian Institute of Technology Goa',
  'Indian Institute of Technology Guwahati',
  'Indian Institute of Technology Hyderabad',
  'Indian Institute of Technology Indore',
  'Indian Institute of Technology Jammu',
  'Indian Institute of Technology Jodhpur',
  'Indian Institute of Technology Kanpur',
  'Indian Institute of Technology Kharagpur',
  'Indian Institute of Technology Madras',
  'Indian Institute of Technology Mandi',
  'Indian Institute of Technology Palakkad',
  'Indian Institute of Technology Patna',
  'Indian Institute of Technology Roorkee',
  'Indian Institute of Technology Ropar',
  'Indian Institute of Technology Tirupati',
  'Indian Institute of Technology (ISM) Dhanbad'
];

// States where IITs are located (for JEE Advanced) - all 23 IITs across 22 states
const IIT_STATES = [
  'Andhra Pradesh',      // IIT Tirupati
  'Assam',               // IIT Guwahati
  'Bihar',               // IIT Patna
  'Chhattisgarh',        // IIT Bhilai
  'Delhi',               // IIT Delhi
  'Goa',                 // IIT Goa
  'Gujarat',             // IIT Gandhinagar
  'Himachal Pradesh',    // IIT Mandi
  'Jammu and Kashmir',   // IIT Jammu
  'Jharkhand',           // IIT Dhanbad, IIT (ISM) Dhanbad
  'Karnataka',           // IIT Dharwad
  'Kerala',              // IIT Palakkad
  'Madhya Pradesh',       // IIT Indore
  'Maharashtra',         // IIT Bombay
  'Odisha',              // IIT Bhubaneswar
  'Punjab',              // IIT Ropar
  'Rajasthan',           // IIT Jodhpur
  'Tamil Nadu',          // IIT Madras
  'Telangana',           // IIT Hyderabad
  'Uttar Pradesh',       // IIT Kanpur, IIT (BHU) Varanasi
  'Uttarakhand',         // IIT Roorkee
  'West Bengal'          // IIT Kharagpur
];

// All Indian States and Union Territories
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

// States that actually have NITs, IIITs, or GFTIs (derived from jee_mains cutoffs.csv)
const JEE_MAIN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const LocationSelector = ({ selectedLocations, onLocationChange, examType, className = "" }) => {
  // Determine location type and options based on exam type
  const locationData = useMemo(() => {
    if (!examType) {
      return { options: [], label: 'Location', placeholder: 'Select exam first' };
    }

    const isDistrictBased = DISTRICT_BASED_EXAMS.includes(examType);
    const isJEEAdvanced = examType === 'JEE Advanced';
    const isJEEMain = examType === 'JEE Main';

    if (isDistrictBased) {
      return {
        options: ANDHRA_PRADESH_DISTRICTS.map(district => ({
          value: district,
          label: district,
        })),
        label: 'Select District',
        placeholder: 'Select district of Andhra Pradesh',
      };
    } else if (isJEEAdvanced) {
      // For JEE Advanced, show only states where IITs are located
      return {
        options: IIT_STATES.map(state => ({
          value: state,
          label: state,
        })),
        label: 'Select State',
        placeholder: 'Select state with IIT',
      };
    } else if (isJEEMain) {
      // For JEE Main, show only states that have NITs, IIITs, or GFTIs
      return {
        options: JEE_MAIN_STATES.map(state => ({
          value: state,
          label: state,
        })),
        label: 'Select State',
        placeholder: 'Select state with NIT / IIIT / GFTI',
      };
    } else {
      return {
        options: INDIAN_STATES.map(state => ({
          value: state,
          label: state,
        })),
        label: 'Select State',
        placeholder: 'Select Indian state',
      };
    }
  }, [examType]);

  // Handle value - support multiple selections
  const locationValue = Array.isArray(selectedLocations) 
    ? selectedLocations
    : (selectedLocations ? [selectedLocations] : []);

  const handleChange = (value) => {
    // Ensure value is always an array for multiple selection
    onLocationChange(Array.isArray(value) ? value : (value ? [value] : []));
  };

  // Determine label and description based on exam type
  const getLabel = () => {
    if (locationData.label === 'Select District') return 'Select Districts';
    return 'Select States';
  };

  const getDescription = () => {
    if (locationData.label === 'Select District') {
      return "Select one or more districts of Andhra Pradesh (multiple selection allowed)";
    }
    if (examType === 'JEE Advanced') {
      return "Select one or more states where IITs are located (multiple selection allowed)";
    }
    if (examType === 'JEE Main') {
      return "Select one or more states with NITs, IIITs, or GFTIs (multiple selection allowed)";
    }
    return "Select one or more Indian states (multiple selection allowed)";
  };

  return (
    <div className={className}>
      <Select
        label={getLabel()}
        description={getDescription()}
        options={locationData.options}
        value={locationValue}
        onChange={handleChange}
        placeholder={locationData.placeholder}
        multiple={true} // Multiple location selection
        searchable
        clearable
        disabled={!examType}
      />
    </div>
  );
};

export default LocationSelector;