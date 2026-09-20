import { users } from "@/db/students_info";

// Utility function to get name from roll number
export function getNameFromRoll(roll) {
  const user = users.find((u) => u.roll === roll);

  if (!user) {
    return "User not found";
  }

  const formattedName = user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formattedName;
}

// Date formatting function
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Unknown Date";
  }
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};
