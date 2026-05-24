/**
 * Coordinate Conversion Utilities
 * Standardizes coordinate handling between GeoJSON [lng, lat] and frontend {latitude, longitude}
 * Location: /client/src/utils/coordinates.js
 */

/**
 * Convert GeoJSON [longitude, latitude] to frontend { latitude, longitude }
 */
export const geoJsonToLatLng = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) {
    return { latitude: 0, longitude: 0 };
  }
  return { latitude: coords[1], longitude: coords[0] };
};

/**
 * Convert frontend { latitude, longitude } to GeoJSON [longitude, latitude]
 */
export const latLngToGeoJson = ({ latitude, longitude }) => [
  longitude,
  latitude,
];

/**
 * Extract coordinates from a user object in either format.
 * Handles: user.coordinates ([lng, lat]), user.location.coordinates ([lng, lat]),
 * or user.latitude/user.longitude.
 *
 * Always returns { latitude, longitude }
 */
export const extractUserCoords = (user) => {
  if (!user) return { latitude: 0, longitude: 0 };

  // GeoJSON array format [lng, lat]
  const coords = user.coordinates || user.location?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return { latitude: coords[1], longitude: coords[0] };
  }

  // Direct properties
  if (user.latitude != null && user.longitude != null) {
    return { latitude: user.latitude, longitude: user.longitude };
  }

  return { latitude: 0, longitude: 0 };
};
