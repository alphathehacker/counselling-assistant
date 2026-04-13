// Static location data for different exam types

// All 26 districts of Andhra Pradesh
export const ANDHRA_PRADESH_DISTRICTS = [
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

// All Indian States and Union Territories
export const INDIAN_STATES = [
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

// Exam types that use districts (AP exams)
export const DISTRICT_BASED_EXAMS = ['AP EAPCET', 'AP ECET'];

// IIT locations for JEE Advanced (all 23 IITs)
export const IIT_LOCATIONS = [
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

// Exam types that use states (national exams)
export const STATE_BASED_EXAMS = ['JEE Main', 'JEE Advanced', 'NEET'];

// States that have NITs, IIITs, or GFTIs (derived from jee_mains cutoffs.csv)
export const JEE_MAIN_STATES = [
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

/**
 * Get location options based on exam type
 * @param {string} examType - The exam type
 * @returns {Array} Array of location options {value, label}
 */
export function getLocationOptions(examType) {
  if (DISTRICT_BASED_EXAMS.includes(examType)) {
    return ANDHRA_PRADESH_DISTRICTS.map(district => ({
      value: district,
      label: district
    }));
  } else if (examType === 'JEE Advanced') {
    return IIT_LOCATIONS.map(iit => ({
      value: iit,
      label: iit
    }));
  } else if (examType === 'JEE Main') {
    return JEE_MAIN_STATES.map(state => ({
      value: state,
      label: state
    }));
  } else if (STATE_BASED_EXAMS.includes(examType)) {
    return INDIAN_STATES.map(state => ({
      value: state,
      label: state
    }));
  }
  return [];
}

/**
 * Check if exam type uses districts
 * @param {string} examType - The exam type
 * @returns {boolean}
 */
export function isDistrictBasedExam(examType) {
  return DISTRICT_BASED_EXAMS.includes(examType);
}

/**
 * Check if exam type uses states
 * @param {string} examType - The exam type
 * @returns {boolean}
 */
export function isStateBasedExam(examType) {
  return STATE_BASED_EXAMS.includes(examType);
}
