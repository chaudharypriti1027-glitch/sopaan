/** Indian states/UTs mapped to Event Registry / Wikipedia location URIs. */
export const INDIAN_STATE_LOCATIONS = {
  National: 'http://en.wikipedia.org/wiki/India',
  'Andhra Pradesh': 'http://en.wikipedia.org/wiki/Andhra_Pradesh',
  'Arunachal Pradesh': 'http://en.wikipedia.org/wiki/Arunachal_Pradesh',
  Assam: 'http://en.wikipedia.org/wiki/Assam',
  Bihar: 'http://en.wikipedia.org/wiki/Bihar',
  Chhattisgarh: 'http://en.wikipedia.org/wiki/Chhattisgarh',
  Delhi: 'http://en.wikipedia.org/wiki/Delhi',
  Goa: 'http://en.wikipedia.org/wiki/Goa',
  Gujarat: 'http://en.wikipedia.org/wiki/Gujarat',
  Haryana: 'http://en.wikipedia.org/wiki/Haryana',
  'Himachal Pradesh': 'http://en.wikipedia.org/wiki/Himachal_Pradesh',
  'Jammu and Kashmir': 'http://en.wikipedia.org/wiki/Jammu_and_Kashmir',
  Jharkhand: 'http://en.wikipedia.org/wiki/Jharkhand',
  Karnataka: 'http://en.wikipedia.org/wiki/Karnataka',
  Kerala: 'http://en.wikipedia.org/wiki/Kerala',
  'Madhya Pradesh': 'http://en.wikipedia.org/wiki/Madhya_Pradesh',
  Maharashtra: 'http://en.wikipedia.org/wiki/Maharashtra',
  Manipur: 'http://en.wikipedia.org/wiki/Manipur',
  Meghalaya: 'http://en.wikipedia.org/wiki/Meghalaya',
  Mizoram: 'http://en.wikipedia.org/wiki/Mizoram',
  Nagaland: 'http://en.wikipedia.org/wiki/Nagaland',
  Odisha: 'http://en.wikipedia.org/wiki/Odisha',
  Punjab: 'http://en.wikipedia.org/wiki/Punjab,_India',
  Rajasthan: 'http://en.wikipedia.org/wiki/Rajasthan',
  Sikkim: 'http://en.wikipedia.org/wiki/Sikkim',
  'Tamil Nadu': 'http://en.wikipedia.org/wiki/Tamil_Nadu',
  Telangana: 'http://en.wikipedia.org/wiki/Telangana',
  Tripura: 'http://en.wikipedia.org/wiki/Tripura',
  'Uttar Pradesh': 'http://en.wikipedia.org/wiki/Uttar_Pradesh',
  Uttarakhand: 'http://en.wikipedia.org/wiki/Uttarakhand',
  'West Bengal': 'http://en.wikipedia.org/wiki/West_Bengal',
};

export const INDIAN_STATE_NAMES = Object.keys(INDIAN_STATE_LOCATIONS).filter(
  (name) => name !== 'National',
);

export function resolveStateLocationUri(state) {
  if (!state || state === 'National' || state === 'national') {
    return INDIAN_STATE_LOCATIONS.National;
  }
  return INDIAN_STATE_LOCATIONS[state] ?? INDIAN_STATE_LOCATIONS.National;
}

export function isKnownIndianState(state) {
  if (!state || state === 'National' || state === 'national') {
    return true;
  }
  return Boolean(INDIAN_STATE_LOCATIONS[state]);
}
