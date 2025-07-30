// Points and limits system for the help feature

export const DAILY_DOUBT_LIMIT = 3;

/**
 * Calculate points for solving a doubt
 * @param {string} solutionContent - The solution text content
 * @param {Array} attachments - Array of solution attachments
 * @param {number} timeStarted - Timestamp when doubt was assigned
 * @param {number} timeSolved - Timestamp when doubt was solved
 * @param {boolean} userSatisfied - Whether user marked as satisfied
 * @returns {number} Total points earned
 */
export function calculateSolverPoints(solutionContent, attachments = [], timeStarted, timeSolved, userSatisfied) {
  // Description length points (0.5 point per character)
  const descriptionPoints = (solutionContent?.length || 0) * 0.5;
  
  // File attachment points (0.5 point per character in all files)
  let filePoints = 0;
  if (attachments && attachments.length > 0) {
    filePoints = attachments.reduce((total, attachment) => {
      const contentLength = attachment.content?.length || 0;
      return total + (contentLength * 0.5);
    }, 0);
  }
  
  // Time taken points (0.1 point per minute)
  const timeMinutes = Math.max(1, Math.floor((timeSolved - timeStarted) / (1000 * 60))); // At least 1 minute
  const timePoints = timeMinutes * 0.1;
  
  // Satisfaction bonus
  const satisfactionBonus = userSatisfied ? 50 : 20;
  
  const totalPoints = descriptionPoints + filePoints + timePoints + satisfactionBonus;
  
  return Math.round(totalPoints * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if user has reached daily doubt limit
 * @param {Array} userDoubts - Array of user's doubts for today
 * @returns {boolean} Whether user has reached limit
 */
export function hasReachedDailyLimit(userDoubts) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const todaysDoubts = userDoubts.filter(doubt => {
    const doubtDate = new Date(doubt.timestamp);
    doubtDate.setHours(0, 0, 0, 0);
    return doubtDate.getTime() === todayTimestamp;
  });
  
  return todaysDoubts.length >= DAILY_DOUBT_LIMIT;
}

/**
 * Get remaining doubts for today
 * @param {Array} userDoubts - Array of user's doubts for today
 * @returns {number} Number of doubts remaining
 */
export function getRemainingDoubts(userDoubts) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const todaysDoubts = userDoubts.filter(doubt => {
    const doubtDate = new Date(doubt.timestamp);
    doubtDate.setHours(0, 0, 0, 0);
    return doubtDate.getTime() === todayTimestamp;
  });
  
  return Math.max(0, DAILY_DOUBT_LIMIT - todaysDoubts.length);
}

/**
 * Get time until next doubt is available (if limit reached)
 * @returns {string} Formatted time string
 */
export function getTimeUntilNextDoubt() {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeDiff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}
