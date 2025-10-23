import { NextResponse } from "next/server";
import {
  getStudentName,
  createStudentMapping,
  formatName,
} from "@/lib/students-loader";
import { getUserDisplayRole } from "@/lib/auth-utils";

export async function GET() {
  try {
    // Import firebase-admin dynamically to avoid build issues
    const { adminDb } = await import("@/lib/firebase-admin");
    
    if (!adminDb) {
      throw new Error("Firebase Admin not available");
    }
    
    // Fetch all users' Nutrinos data from Firebase
    const nutrinosRef = adminDb.ref("userNutrinos");
    const snapshot = await nutrinosRef.once("value");
    const allUsersData = snapshot.val() || {};

    // Process data for statistics
    const processedData = processNutrinosData(allUsersData);

    return NextResponse.json({
      success: true,
      data: {
        topUsersAllTime: processedData.allTime,
        topUsersMonth: processedData.thisMonth,
        monthlyActivity: processedData.monthly,
        totalUsers: processedData.totalUsers,
        totalNutrinos: processedData.totalNutrinos,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch statistics data. Using client-side fallback.",
      },
      { status: 500 }
    );
  }
}

function processNutrinosData(allUsersData) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Create student name mapping
  const studentMapping = createStudentMapping();

  const users = Object.entries(allUsersData).map(([roll, data]) => {
    // Calculate this month's Nutrinos
    const thisMonthNutrinos = (data.nutrinosHistory || [])
      .filter((entry) => {
        const entryDate = new Date(entry.timestamp);
        return (
          entryDate.getMonth() === currentMonth &&
          entryDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, entry) => sum + (entry.nutrinos || 0), 0);

    // Get proper name - prioritize student database, then stored name, then fallback
    const displayName = studentMapping[roll] || 
                       (data.name ? formatName(data.name) : null) || 
                       getStudentName(roll);

    return {
      roll,
      name: displayName,
      originalName: displayName,
      totalNutrinos: data.totalNutrinos || 0,
      thisMonthNutrinos,
      rank: data.rank || "Explorer",
      level: data.level || 1,
      history: data.nutrinosHistory || [],
    };
  });

  // Check for duplicate names and append roll numbers to make them unique
  const nameCount = {};
  users.forEach(user => {
    nameCount[user.name] = (nameCount[user.name] || 0) + 1;
  });

  // Update names for duplicates
  users.forEach(user => {
    if (nameCount[user.name] > 1) {
      user.name = `${user.originalName} (${user.roll})`;
    }
  });

  // Sort for all-time leaderboard
  const allTimeTop = users
    .sort((a, b) => b.totalNutrinos - a.totalNutrinos)
    .slice(0, 5) // Limit to 5 for sidebar
    .map(user => ({
      roll: user.roll,
      name: user.name,
      totalNutrinos: user.totalNutrinos,
      level: user.level,
      rank: user.rank,
    }));

  // Sort for this month leaderboard
  const thisMonthTop = users
    .filter((user) => user.thisMonthNutrinos > 0)
    .sort((a, b) => b.thisMonthNutrinos - a.thisMonthNutrinos)
    .slice(0, 5) // Limit to 5 for sidebar
    .map(user => ({
      roll: user.roll,
      name: user.name,
      thisMonthNutrinos: user.thisMonthNutrinos,
    }));

  // Calculate monthly activity
  const monthlyStats = {};
  let totalNutrinosSum = 0;

  users.forEach((user) => {
    totalNutrinosSum += user.totalNutrinos;
    user.history.forEach((entry) => {
      // Monthly activity
      const date = new Date(entry.timestamp);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyStats[monthKey] =
        (monthlyStats[monthKey] || 0) + Math.abs(entry.nutrinos || 0);
    });
  });

  // Get last 6 months for chart
  const sortedMonths = Object.keys(monthlyStats).sort();
  const last6Months = sortedMonths.slice(-6);
  const chartData = last6Months.map(month => ({
    month: new Date(month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
    value: monthlyStats[month] || 0,
  }));

  return {
    allTime: allTimeTop,
    thisMonth: thisMonthTop,
    monthly: chartData,
    totalUsers: users.length,
    totalNutrinos: totalNutrinosSum,
  };
}