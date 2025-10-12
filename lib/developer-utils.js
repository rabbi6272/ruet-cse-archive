import { ref, onValue } from 'firebase/database';
import { db } from './firebase';

/**
 * Utility functions for managing developer data
 */

/**
 * Fetch dynamic developer data from Firebase
 * @returns {Promise<Array>} Array of developers from database
 */
export const fetchDynamicDevelopers = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve([]); // Return empty array if database not available
      return;
    }

    const developersRef = ref(db, 'developers');
    const unsubscribe = onValue(
      developersRef, 
      (snapshot) => {
        try {
          const data = snapshot.val() || {};
          const developersList = Object.entries(data).map(([id, developer]) => ({
            firebaseId: id, // Store the Firebase key
            ...developer
          }));
          unsubscribe(); // Unsubscribe after getting data once
          resolve(developersList);
        } catch (error) {
          console.error('Error processing developer data:', error);
          resolve([]); // Return empty array on error
        }
      },
      (error) => {
        console.error('Error fetching developer data:', error);
        resolve([]); // Return empty array on error
      }
    );
  });
};

/**
 * Listen to real-time developer data changes
 * @param {Function} callback - Callback function to handle data updates
 * @returns {Function} Unsubscribe function
 */
export const listenToDeveloperUpdates = (callback) => {
  if (!db) {
    callback([]); // Call with empty array if database not available
    return () => {}; // Return empty unsubscribe function
  }

  const developersRef = ref(db, 'developers');
  return onValue(
    developersRef,
    (snapshot) => {
      try {
        const data = snapshot.val() || {};
        const developersList = Object.entries(data).map(([id, developer]) => ({
          firebaseId: id,
          ...developer
        }));
        callback(developersList);
      } catch (error) {
        console.error('Error processing developer data updates:', error);
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to developer updates:', error);
      callback([]);
    }
  );
};

/**
 * Merge static developer data with dynamic developer data
 * @param {Array} staticDevelopers - Static developer data
 * @param {Array} dynamicDevelopers - Dynamic developer data from database
 * @returns {Array} Merged developer data
 */
export const mergeDeveloperData = (staticDevelopers, dynamicDevelopers) => {
  const merged = [...staticDevelopers];
  
  // Add dynamic developers with a source indicator
  dynamicDevelopers.forEach(developer => {
    merged.push({
      ...developer,
      isDynamic: true, // Flag to identify dynamic developers
      // Ensure consistent data structure
      name: developer.name,
      role: developer.role,
      location: developer.location,
      image: developer.image || '/public/images/developers/default.jpg',
      github: developer.github || '#',
      linkedin: developer.linkedin || '#',
      facebook: developer.facebook || '#',
      roll: developer.roll || undefined
    });
  });

  return merged;
};

/**
 * Get all developer data (static + dynamic)
 * @param {Array} staticDevelopers - Static developer data
 * @returns {Promise<Array>} Combined developer data
 */
export const getAllDeveloperData = async (staticDevelopers) => {
  try {
    const dynamicDevelopers = await fetchDynamicDevelopers();
    return mergeDeveloperData(staticDevelopers, dynamicDevelopers);
  } catch (error) {
    console.error('Error getting all developer data:', error);
    return staticDevelopers; // Return only static data if dynamic fetch fails
  }
};

/**
 * Group developers by role category
 * @param {Array} developers - Array of developers
 * @returns {Object} Grouped developers by category
 */
export const groupDevelopersByRole = (developers) => {
  return {
    "Frontend & Backend Developers": developers.filter(
      (dev) => dev.role.includes("Frontend") || dev.role.includes("Backend")
    ),
    Security: developers.filter((dev) => dev.role.includes("Security")),
    "Media Team": developers.filter((dev) => dev.role.includes("Media")),
    "Code Reviewers & Testers": developers.filter(
      (dev) =>
        dev.role.includes("Code Reviewer") ||
        (dev.role.includes("Tester") && !dev.role.includes("Security"))
    ),
    "Idea & Resource Management": developers.filter(
      (dev) => dev.role.includes("Idea") || dev.role.includes("Resource") || dev.role.includes("Suggestions")
    ),
  };
};

/**
 * Validate developer data structure
 * @param {Object} developer - Developer data to validate
 * @returns {Boolean} Whether the data is valid
 */
export const validateDeveloperData = (developer) => {
  const required = ['name', 'role', 'location'];
  
  for (const field of required) {
    if (!developer[field]) {
      return false;
    }
  }

  // Check if at least one social media link is provided
  const socialLinks = [developer.github, developer.linkedin, developer.facebook];
  const validLinks = socialLinks.filter(link => link && link !== '#' && link.trim() !== '');
  
  if (validLinks.length === 0) {
    return false;
  }

  return true;
};

/**
 * Format developer data for display
 * @param {Object} developer - Developer data
 * @returns {Object} Formatted developer data
 */
export const formatDeveloperForDisplay = (developer) => {
  return {
    ...developer,
    displayName: developer.name || 'Unknown Developer',
    displayRole: developer.role || 'Team Member',
    displayLocation: developer.location || 'Unknown Location',
    hasValidGithub: developer.github && developer.github !== '#',
    hasValidLinkedIn: developer.linkedin && developer.linkedin !== '#',
    hasValidFacebook: developer.facebook && developer.facebook !== '#',
    isNewlyAdded: developer.isDynamic && new Date(developer.dateAdded) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Added in last 30 days
  };
};

/**
 * Get developer statistics
 * @param {Array} developers - Array of developers
 * @returns {Object} Statistics about developers
 */
export const getDeveloperStats = (developers) => {
  const grouped = groupDevelopersByRole(developers);
  const dynamicCount = developers.filter(dev => dev.isDynamic).length;
  const staticCount = developers.length - dynamicCount;
  
  return {
    total: developers.length,
    static: staticCount,
    dynamic: dynamicCount,
    byRole: Object.keys(grouped).reduce((acc, role) => {
      acc[role] = grouped[role].length;
      return acc;
    }, {}),
    newThisMonth: developers.filter(dev => 
      dev.isDynamic && 
      new Date(dev.dateAdded) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
  };
};