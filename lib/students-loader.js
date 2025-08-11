// Students data loader utility
import { users } from "@/db/students_info";
/**
 * Format name to proper case (Title Case)
 * @param {string} name - Name to format
 * @returns {string} - Formatted name
 */
export const formatName = (name) => {
  if (!name) return name;
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get student name by roll number
 * @param {string} roll - Student roll number
 * @returns {string} - Student name or default fallback
 */
export const getStudentName = (roll) => {
  const student = users.find((s) => s.roll === roll);
  return student ? formatName(student.name) : `Student ${roll}`;
};

/**
 * Create a mapping of roll numbers to names
 * @returns {Object} - Object with roll as key and name as value
 */
export const createStudentMapping = () => {
  const mapping = {};
  users.forEach((student) => {
    mapping[student.roll] = formatName(student.name);
  });
  return mapping;
};

const studentsLoader = {
  getStudentName,
  createStudentMapping,
  users,
};

export default studentsLoader;
