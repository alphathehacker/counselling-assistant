/**
 * District Normalization Utility
 * Maps district abbreviations to full names (AP EAPCET specific)
 */

const districtMap = {
  'ATP': 'Anantapur',
  'ANANTAPUR': 'Anantapur',
  'ANANTAPURAM': 'Anantapur',
  'ANANTAPURAMU': 'Anantapur',
  'CDP': 'Kadapa',
  'KDP': 'Kadapa',
  'YSR': 'Kadapa',
  'CUD': 'Kadapa',
  'KADAPA': 'Kadapa',
  'YSRKADAPA': 'Kadapa',
  'CTR': 'Chittoor',
  'CHITTOOR': 'Chittoor',
  'EG': 'East Godavari',
  'EGD': 'East Godavari',
  'EASTGODAVARI': 'East Godavari',
  'GTR': 'Guntur',
  'GNT': 'Guntur',
  'GUNTUR': 'Guntur',
  'KRN': 'Kurnool',
  'KNL': 'Kurnool',
  'KURNOOL': 'Kurnool',
  'KAK': 'Krishna',
  'KRI': 'Krishna',
  'KRISHNA': 'Krishna',
  'NLR': 'Nellore',
  'NELLORE': 'Nellore',
  'PKM': 'Prakasam',
  'PKS': 'Prakasam',
  'PRAKASAM': 'Prakasam',
  'SKM': 'Srikakulam',
  'SKL': 'Srikakulam',
  'SRIKAKULAM': 'Srikakulam',
  'VSP': 'Visakhapatnam',
  'VIZ': 'Visakhapatnam',
  'VIZAG': 'Visakhapatnam',
  'VISAKHAPATNAM': 'Visakhapatnam',
  'VZM': 'Vizianagaram',
  'VIZI': 'Vizianagaram',
  'VIZIANAGARAM': 'Vizianagaram',
  'WG': 'West Godavari',
  'WGD': 'West Godavari',
  'WESTGODAVARI': 'West Godavari',
  'ANNAMAYYA': 'Annamayya',
  'BAPATLA': 'Bapatla',
  'ELURU': 'Eluru',
  'KAKINADA': 'Kakinada',
  'KONASEEMA': 'Konaseema',
  'NANDYAL': 'Nandyal',
  'NTR': 'NTR District',
  'PALNADU': 'Palnadu',
  'PARVATHIPURAM': 'Parvathipuram Manyam',
  'RAJAMAHENDRAVARAM': 'Rajamahendravaram',
  'SPSR': 'Sri Potti Sriramulu Nellore',
  'TIRUPATI': 'Tirupati',
};

/**
 * Normalize district name
 * @param {string} value - District name or abbreviation
 * @returns {string} - Normalized district name
 */
export const normalizeDistrict = (value) => {
  if (!value) return '';
  const clean = value.toString().trim().toUpperCase().replace(/\s+/g, '');
  return districtMap[clean] || value.toString().trim().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Check if district matches (case-insensitive, contains)
 * @param {string} district - District from database
 * @param {string} input - User input district
 * @returns {boolean}
 */
export const districtMatches = (district, input) => {
  if (!district || !input) return false;
  
  // Normalize both sides to full name if possible
  const normalizedDistrict = normalizeDistrict(district).toLowerCase();
  const normalizedInput = normalizeDistrict(input).toLowerCase();
  
  // Strict cleanup for comparison
  const dClean = normalizedDistrict.replace(/\s+/g, '');
  const iClean = normalizedInput.replace(/\s+/g, '');
  
  return dClean.includes(iClean) || iClean.includes(dClean);
};
