import { ref, onValue } from 'firebase/database';
import { db } from './firebase';

/**
 * Utility functions for managing alumni data
 */

/**
 * Fetch dynamic alumni data from Firebase
 * @returns {Promise<Array>} Array of alumni from database
 */
export const fetchDynamicAlumni = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve([]); // Return empty array if database not available
      return;
    }

    const alumniRef = ref(db, 'alumni');
    const unsubscribe = onValue(
      alumniRef, 
      (snapshot) => {
        try {
          const data = snapshot.val() || {};
          const alumniList = Object.entries(data).map(([id, alumnus]) => ({
            firebaseId: id, // Store the Firebase key
            ...alumnus
          }));
          unsubscribe(); // Unsubscribe after getting data once
          resolve(alumniList);
        } catch (error) {
          console.error('Error processing alumni data:', error);
          resolve([]); // Return empty array on error
        }
      },
      (error) => {
        console.error('Error fetching alumni data:', error);
        resolve([]); // Return empty array on error
      }
    );
  });
};

/**
 * Listen to real-time alumni data changes
 * @param {Function} callback - Callback function to handle data updates
 * @returns {Function} Unsubscribe function
 */
export const listenToAlumniUpdates = (callback) => {
  if (!db) {
    callback([]); // Call with empty array if database not available
    return () => {}; // Return empty unsubscribe function
  }

  const alumniRef = ref(db, 'alumni');
  return onValue(
    alumniRef,
    (snapshot) => {
      try {
        const data = snapshot.val() || {};
        const alumniList = Object.entries(data).map(([id, alumnus]) => ({
          firebaseId: id,
          ...alumnus
        }));
        callback(alumniList);
      } catch (error) {
        console.error('Error processing alumni data updates:', error);
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to alumni updates:', error);
      callback([]);
    }
  );
};

/**
 * Merge static alumni data with dynamic alumni data
 * @param {Array} staticAlumni - Static alumni data
 * @param {Array} dynamicAlumni - Dynamic alumni data from database
 * @returns {Array} Merged alumni data
 */
export const mergeAlumniData = (staticAlumni, dynamicAlumni) => {
  const merged = [...staticAlumni];
  
  // Add dynamic alumni with a source indicator
  dynamicAlumni.forEach(alumnus => {
    merged.push({
      ...alumnus,
      isDynamic: true, // Flag to identify dynamic alumni
      // Ensure consistent data structure
      Id: alumnus.Id || alumnus.firebaseId,
      type: alumnus.type || 'Point'
    });
  });

  return merged;
};

/**
 * Get all alumni data (static + dynamic)
 * @param {Array} staticAlumni - Static alumni data
 * @returns {Promise<Array>} Combined alumni data
 */
export const getAllAlumniData = async (staticAlumni) => {
  try {
    const dynamicAlumni = await fetchDynamicAlumni();
    return mergeAlumniData(staticAlumni, dynamicAlumni);
  } catch (error) {
    console.error('Error getting all alumni data:', error);
    return staticAlumni; // Return only static data if dynamic fetch fails
  }
};

/**
 * Validate alumni data structure
 * @param {Object} alumnus - Alumni data to validate
 * @returns {Boolean} Whether the data is valid
 */
export const validateAlumnusData = (alumnus) => {
  const required = ['name', 'dept', 'series', 'address', 'country', 'coordinates'];
  
  for (const field of required) {
    if (!alumnus[field]) {
      return false;
    }
  }

  // Validate coordinates
  if (!Array.isArray(alumnus.coordinates) || 
      alumnus.coordinates.length !== 2 ||
      typeof alumnus.coordinates[0] !== 'number' ||
      typeof alumnus.coordinates[1] !== 'number') {
    return false;
  }

  return true;
};

/**
 * Format alumni data for display
 * @param {Object} alumnus - Alumni data
 * @returns {Object} Formatted alumni data
 */
export const formatAlumnusForDisplay = (alumnus) => {
  return {
    ...alumnus,
    badges: alumnus.badges ? alumnus.badges.split(',').map(b => b.trim()).filter(b => b) : [],
    displayName: alumnus.name || 'Unknown Alumni',
    displayLocation: `${alumnus.address}, ${alumnus.country}`,
    isNewlyAdded: alumnus.isDynamic && new Date(alumnus.dateAdded) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Added in last 30 days
  };
};