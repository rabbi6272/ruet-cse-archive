// Utility functions for code reviewer authorization

// Code reviewers data from developers array
export const codeReviewers = [
  {
    name: "Md. Fazle Rabbi",
    roll: "2403172",
    role: "Frontend & Backend, Code Reviewer",
  },
  {
    name: "Bitto Saha",
    roll: "2403142",
    role: "Frontend & Backend, Code Reviewer",
  },
  {
    name: "Morchhalin Alam Amio",
    roll: "2403154",
    role: "Security & Tester",
  },
  {
    name: "Sumon Majumder",
    roll: "2403129",
    role: "Code Reviewer & Tester",
  },
  {
    name: "Nilay Paul Partha",
    roll: "2403160",
    role: "Code Reviewer & Tester",
  },
  {
    name: "Mirajul Islam",
    roll: "2403147",
    role: "Code Reviewer & Tester",
  },
  {
    name: "Tasaouf Ahnaf",
    roll: "2403140",
    role: "Code Reviewer & Tester",
  },
  {
    name: "Arnob Benedict Tudu",
    roll: "2403155",
    role: "Code Reviewer & Tester",
  },
  {
    name: "Shadman Ahmed",
    roll: "2403127",
    role: "Code Reviewer & Tester",
  },
];

// Additional role-based access
export const roleBasedAccess = [
  "reviewer",
  "admin",
  "moderator",
  "code reviewer",
];

/**
 * Check if a user is an authorized code reviewer
 * @param {Object} user - User object with name, roll, role properties
 * @returns {boolean} - True if user is authorized reviewer
 */
export const isAuthorizedReviewer = (user) => {
  if (!user) return false;

  const userName = user.name?.toLowerCase() || "";
  const userRoll = user.roll?.toString() || "";
  const userRole = user.role?.toLowerCase() || "";

  // Check against code reviewers list
  const isCodeReviewer = codeReviewers.some((reviewer) => {
    // Check by roll number (exact match)
    if (reviewer.roll && userRoll === reviewer.roll) {
      return true;
    }

    // Check by name (exact and partial matches)
    const reviewerName = reviewer.name.toLowerCase();
    if (
      userName === reviewerName ||
      userName.includes(reviewerName) ||
      reviewerName.includes(userName)
    ) {
      return true;
    }

    // Check if any part of user name matches reviewer name
    const userNameParts = userName.split(" ");
    const reviewerNameParts = reviewerName.split(" ");

    const namePartsMatch = userNameParts.some((userPart) =>
      reviewerNameParts.some(
        (reviewerPart) => userPart === reviewerPart && userPart.length > 2
      )
    );

    if (namePartsMatch) {
      return true;
    }

    return false;
  });

  // Check role-based access
  const hasRoleAccess = roleBasedAccess.some(
    (role) => userRole.includes(role) || userRoll === role
  );

  const result = isCodeReviewer || hasRoleAccess;

  return result;
};

/**
 * Get the current user from localStorage
 * @returns {Object|null} - User object or null if not found
 */
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if current user is an authorized code reviewer
 * @returns {boolean} - True if current user is authorized reviewer
 */
export const isCurrentUserReviewer = () => {
  const user = getCurrentUser();
  return isAuthorizedReviewer(user);
};

/**
 * Get user's display role with fallback to "An avenger"
 * @param {Object} user - User object with name, roll, role properties
 * @returns {string} - User's display role
 */
export const getUserDisplayRole = (user) => {
  if (!user) return "An avenger";

  const userRoll = user.roll?.toString() || "";
  const userRole = user.role?.toLowerCase() || "";

  // Check if user is a code reviewer
  const isCodeReviewer = codeReviewers.some((reviewer) => {
    return (
      reviewer.roll === userRoll ||
      userRole.includes("code reviewer") ||
      userRole.includes("reviewer")
    );
  });

  if (isCodeReviewer) {
    return "Code Reviewer";
  }

  // Check for developer role
  if (userRole.includes("developer") || userRole.includes("dev")) {
    return "Developer";
  }

  // Check for other specific roles
  if (userRole.includes("security")) {
    return "Security Specialist";
  }

  if (userRole.includes("tester")) {
    return "Tester";
  }

  if (userRole.includes("admin")) {
    return "Admin";
  }

  if (userRole.includes("moderator")) {
    return "Moderator";
  }

  // Default role for all users
  return "An avenger";
};
