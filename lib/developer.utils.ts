import type { Developer } from "@/app/contact&help/developers/page";

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
