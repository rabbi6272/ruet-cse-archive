import { getStudentName } from "@/lib/students-loader";

// Re-export getNameFromRoll from the single source
export const getNameFromRoll = getStudentName;

// Date formatting function
export function formatDate(dateString?: string): string {
  const date = new Date(dateString ?? "");
  if (isNaN(date.getTime())) {
    return "Unknown Date";
  }
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}