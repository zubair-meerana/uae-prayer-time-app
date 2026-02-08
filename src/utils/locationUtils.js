/**
 * Utility functions for precise location-based emirate detection
 */

// UAE Emirates boundaries (approximate coordinates)
const EMIRATE_BOUNDARIES = {
  'dubai': {
    name: 'Dubai',
    coordinates: {
      north: 25.3573,
      south: 24.8564,
      east: 55.6667,
      west: 55.1713
    }
  },
  'abu-dhabi': {
    name: 'Abu Dhabi',
    coordinates: {
      north: 24.5555,
      south: 22.8833,
      east: 56.3967,
      west: 53.6250
    }
  },
  'sharjah': {
    name: 'Sharjah',
    coordinates: {
      north: 25.4167,
      south: 24.9833,
      east: 55.6667,
      west: 55.3333
    }
  },
  'ajman': {
    name: 'Ajman',
    coordinates: {
      north: 25.4167,
      south: 25.3333,
      east: 55.5833,
      west: 55.4167
    }
  },
  'ras-al-khaimah': {
    name: 'Ras Al Khaimah',
    coordinates: {
      north: 25.8333,
      south: 25.6667,
      east: 56.0000,
      west: 55.7500
    }
  },
  'fujairah': {
    name: 'Fujairah',
    coordinates: {
      north: 25.6667,
      south: 25.1667,
      east: 56.3333,
      west: 56.0000
    }
  },
  'umm-al-quwain': {
    name: 'Umm Al Quwain',
    coordinates: {
      north: 25.5833,
      south: 25.5000,
      east: 55.6667,
      west: 55.5000
    }
  }
};

/**
 * Determines which emirate a given coordinate is in
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {string|null} - Emirate value ('dubai', 'abu-dhabi', etc.) or null if not in UAE
 */
export const determineEmirateFromCoordinates = (latitude, longitude) => {
  for (const [emirateValue, emirateData] of Object.entries(EMIRATE_BOUNDARIES)) {
    if (
      latitude >= emirateData.coordinates.south &&
      latitude <= emirateData.coordinates.north &&
      longitude >= emirateData.coordinates.west &&
      longitude <= emirateData.coordinates.east
    ) {
      return emirateValue;
    }
  }

  // If not in any defined boundary, return null
  return null;
};

/**
 * Gets the closest emirate if coordinates are outside defined boundaries
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {string} - Closest emirate value
 */
export const getClosestEmirate = (latitude, longitude) => {
  let closestEmirate = null;
  let minDistance = Infinity;

  for (const [emirateValue, emirateData] of Object.entries(EMIRATE_BOUNDARIES)) {
    // Calculate center of emirate
    const centerLat = (emirateData.coordinates.north + emirateData.coordinates.south) / 2;
    const centerLng = (emirateData.coordinates.east + emirateData.coordinates.west) / 2;

    // Calculate distance to center
    const distance = Math.sqrt(
      Math.pow(latitude - centerLat, 2) +
      Math.pow(longitude - centerLng, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestEmirate = emirateValue;
    }
  }

  return closestEmirate;
};

/**
 * Checks if coordinates are within UAE boundaries
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {boolean} - True if coordinates are in UAE
 */
export const isLocationInUAE = (latitude, longitude) => {
  // UAE approximate boundaries
  const UAE_NORTH = 26.0726;
  const UAE_SOUTH = 22.6315;
  const UAE_EAST = 56.3817;
  const UAE_WEST = 51.5835;

  return (
    latitude >= UAE_SOUTH &&
    latitude <= UAE_NORTH &&
    longitude >= UAE_WEST &&
    longitude <= UAE_EAST
  );
};
