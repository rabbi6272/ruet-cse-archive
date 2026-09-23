import { Developer } from "@/app/contact&help/developers/page";

/**
 * Group developers by role category
 * @param {Array} developers - Array of developers
 * @returns {Object} Grouped developers by category
 */
export const groupDevelopersByRole: (developers: Developer[]) => Record<string, Developer[]> = (developers) => {
  return {
    "Frontend & Backend Developers": developers.filter(
      (dev) => dev.role.includes("Frontend") || dev.role.includes("Backend")
    ),
    "Security": developers.filter((dev) => dev.role.includes("Security")),
    "Media Team": developers.filter((dev) => dev.role.includes("Media")),
    "Code Reviewers & Testers": developers.filter(
      (dev) =>
        dev.role.includes("Code Reviewer") ||
        (dev.role.includes("Tester") && !dev.role.includes("Security"))
    ),
    "Resource Management": developers.filter(
      (dev) =>
        dev.role.includes("Idea") ||
        dev.role.includes("Resource") ||
        dev.role.includes("Suggestions")
    ),
  };
};

/**
 * Validate developer data structure
 * @param {Object} developer - Developer data to validate
 * @returns {Boolean} Whether the data is valid
 */
export const validateDeveloperData = (developer: Developer) => {
  const required = ["name", "role", "location"];

  for (const field of required) {
    if (!developer[field]) {
      return false;
    }
  }

  // Check if at least one social media link is provided
  const socialLinks = [
    developer.github,
    developer.linkedin,
    developer.facebook,
  ];
  const validLinks = socialLinks.filter(
    (link) => link && link !== "#" && link.trim() !== ""
  );

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
export const formatDeveloperForDisplay = (developer: Developer) => {
  return {
    ...developer,
    displayName: developer.name || "Unknown Developer",
    displayRole: developer.role || "Team Member",
    displayLocation: developer.location || "Unknown Location",
    hasValidGithub: developer.github && developer.github !== "#",
    hasValidLinkedIn: developer.linkedin && developer.linkedin !== "#",
    hasValidFacebook: developer.facebook && developer.facebook !== "#",
  };
};

/**
 * Get developer statistics
 * @param {Array} developers - Array of developers
 * @returns {Object} Statistics about developers
 */
export const getDeveloperStats = (developers: Developer[]) => {
  const grouped = groupDevelopersByRole(developers);
  const dynamicCount = developers.filter((dev) => dev.isDynamic).length;
  const staticCount = developers.length - dynamicCount;

  return {
    total: developers.length,
    static: staticCount,
    dynamic: dynamicCount,
    byRole: Object.keys(grouped).reduce((acc, role) => {
      acc[role] = grouped[role].length;
      return acc;
    }, {}),
    newThisMonth: developers.filter(
      (dev) =>
        dev.isDynamic &&
        new Date(dev.dateAdded) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
  };
};
