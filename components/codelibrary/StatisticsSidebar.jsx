"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Line } from "react-chartjs-2";
import {
  getStudentName,
  createStudentMapping,
  formatName,
} from "@/lib/students-loader";
import { getUserDisplayRole } from "@/lib/auth-utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StatisticsSidebar = () => {
  const [loading, setLoading] = useState(true);
  const [topUsersMonth, setTopUsersMonth] = useState([]);
  const [topUsersAllTime, setTopUsersAllTime] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState({});
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalNutrinos, setTotalNutrinos] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatisticsData();
  }, []);

  const fetchStatisticsData = async () => {
    try {
      setLoading(true);

      // Fetch all users' Nutrinos data
      const nutrinosRef = ref(db, "userNutrinos");
      const snapshot = await get(nutrinosRef);
      const allUsersData = snapshot.val() || {};

      // Process data for different statistics
      const processedData = processNutrinosData(allUsersData);

      setTopUsersAllTime(processedData.allTime);
      setTopUsersMonth(processedData.thisMonth);
      setMonthlyActivity(processedData.monthly);
      setTotalUsers(processedData.totalUsers);
      setTotalNutrinos(processedData.totalNutrinos);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError("Failed to load statistics data");
    } finally {
      setLoading(false);
    }
  };

  const processNutrinosData = (allUsersData) => {
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
      .slice(0, 5); // Limit to 5 for sidebar

    // Sort for this month leaderboard
    const thisMonthTop = users
      .filter((user) => user.thisMonthNutrinos > 0)
      .sort((a, b) => b.thisMonthNutrinos - a.thisMonthNutrinos)
      .slice(0, 5); // Limit to 5 for sidebar

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

    return {
      allTime: allTimeTop,
      thisMonth: thisMonthTop,
      monthly: monthlyStats,
      totalUsers: users.length,
      totalNutrinos: totalNutrinosSum,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for sidebar
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            size: 10,
          },
        },
      },
      x: {
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            size: 10,
          },
        },
      },
    },
  };

  const getMonthlyChart = () => {
    const sortedMonths = Object.keys(monthlyActivity).sort();
    const labels = sortedMonths.slice(-6); // Last 6 months for sidebar
    const data = labels.map((month) => monthlyActivity[month] || 0);

    return {
      labels: labels.map((month) => {
        const [year, monthNum] = month.split("-");
        return new Date(year, monthNum - 1).toLocaleDateString("en-US", {
          month: "short",
        });
      }),
      datasets: [
        {
          label: "Monthly Nutrinos Activity",
          data,
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "rgba(16, 185, 129, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl mb-2">😞</div>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchStatisticsData}
            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-lg mb-1">👥</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {totalUsers}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Active Coders
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-lg mb-1">⚡</div>
          <div className="text-sm font-bold text-green-600 dark:text-green-400">
            {totalNutrinos.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Total Nutrinos
          </div>
        </div>
      </div>

      {/* Top Contributors This Month */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
          <span className="text-xl mr-2">⭐</span>
          This Month
        </h3>
        <div className="space-y-2">
          {topUsersMonth.length > 0 ? (
            topUsersMonth.map((user, index) => (
              <div key={user.roll} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs bg-gradient-to-r from-blue-500 to-indigo-600">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {user.name.length > 15 ? user.name.substring(0, 15) + '...' : user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.roll}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-green-600 dark:text-green-400">
                    ⚡{user.thisMonthNutrinos.toFixed(1)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl mb-1">🚀</div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Be the first this month!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All-Time Champions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
          <span className="text-xl mr-2">🏆</span>
          All-Time Top
        </h3>
        <div className="space-y-2">
          {topUsersAllTime.map((user, index) => (
            <div key={user.roll} className={`flex items-center justify-between p-2 rounded-lg ${
              index === 0
                ? "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20"
                : index === 1
                ? "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20"
                : index === 2
                ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
                : "bg-gray-50 dark:bg-gray-700/50"
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-400 to-gray-500"
                    : index === 2
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}>
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {user.name.length > 15 ? user.name.substring(0, 15) + '...' : user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.roll} • Lv.{user.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-green-600 dark:text-green-400">
                  ⚡{user.totalNutrinos.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
          <span className="text-xl mr-2">📈</span>
          Activity Trend
        </h3>
        {Object.keys(monthlyActivity).length > 0 ? (
          <div className="h-48">
            <Line
              data={getMonthlyChart()}
              options={chartOptions}
            />
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <p className="text-xs">No data yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsSidebar;