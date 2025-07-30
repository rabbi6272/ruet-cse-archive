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

const StatisticsPage = () => {
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

      // Get proper name - prioritize stored name, then student mapping, then fallback
      const displayName = data.name
        ? formatName(data.name)
        : studentMapping[roll] || getStudentName(roll);

      return {
        roll,
        name: displayName,
        totalNutrinos: data.totalNutrinos || 0,
        thisMonthNutrinos,
        rank: data.rank || "Explorer",
        level: data.level || 1,
        history: data.nutrinosHistory || [],
      };
    });

    // Sort for all-time leaderboard
    const allTimeTop = users
      .sort((a, b) => b.totalNutrinos - a.totalNutrinos)
      .slice(0, 10);

    // Sort for this month leaderboard
    const thisMonthTop = users
      .filter((user) => user.thisMonthNutrinos > 0)
      .sort((a, b) => b.thisMonthNutrinos - a.thisMonthNutrinos)
      .slice(0, 10);

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
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "Inter, sans-serif",
          },
        },
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
          },
        },
      },
    },
  };

  const getMonthlyChart = () => {
    const sortedMonths = Object.keys(monthlyActivity).sort();
    const labels = sortedMonths.slice(-12); // Last 12 months
    const data = labels.map((month) => monthlyActivity[month] || 0);

    return {
      labels: labels.map((month) => {
        const [year, monthNum] = month.split("-");
        return new Date(year, monthNum - 1).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
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
          pointRadius: 6,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading statistics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md mx-4">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-red-600 dark:text-red-400 text-lg mb-6">{error}</p>
          <button
            onClick={fetchStatisticsData}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="relative z-10 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">
              Code Library Analytics
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Discover the incredible contributions and achievements of our
              coding community
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl lg:text-3xl mb-2">👥</div>
              <div className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {totalUsers}
              </div>
              <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Active Coders
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl lg:text-3xl mb-2 lightning-icon">⚡</div>
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm lg:text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300 nutrinos-badge-reduced cursor-pointer">
                <span className="font-extrabold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  {totalNutrinos.toFixed(0)} Nutrinos
                </span>
              </div>
              <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-2">
                Total Earned
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl lg:text-3xl mb-2">📈</div>
              <div className="text-xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
                {topUsersMonth.length}
              </div>
              <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Active This Month
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl lg:text-3xl mb-2">🏆</div>
              <div className="text-xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {topUsersAllTime.length}
              </div>
              <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Top Contributors
              </div>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
            {/* All-Time Champions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6 lg:mb-8 flex items-center">
                <span className="text-2xl sm:text-3xl lg:text-4xl mr-2 lg:mr-3">
                  🏆
                </span>
                All-Time Avengers
              </h2>
              <div className="space-y-3 lg:space-y-4">
                {topUsersAllTime.map((user, index) => (
                  <div key={user.roll} className="group">
                    <div
                      className={`relative overflow-hidden rounded-lg lg:rounded-xl p-3 lg:p-4 ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-600"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700"
                          : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                      } border transition-all duration-300 hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 lg:space-x-4">
                          <div
                            className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm lg:text-lg ${
                              index === 0
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : index === 1
                                ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                : index === 2
                                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                                : "bg-gradient-to-r from-blue-500 to-blue-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg truncate">
                              {user.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Roll: {user.roll} •{" "}
                              {getUserDisplayRole({ roll: user.roll })} • Level{" "}
                              {user.level}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg transform hover:scale-105 transition-all duration-200 nutrinos-badge-reduced">
                            <span className="lightning-icon text-xs">⚡</span>
                            <span className="font-extrabold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                              {user.totalNutrinos.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Total Nutrinos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Stars */}
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6 lg:mb-8 flex items-center">
                <span className="text-2xl sm:text-3xl lg:text-4xl mr-2 lg:mr-3">
                  ⭐
                </span>
                Monthly Contributions
              </h2>
              <div className="space-y-3 lg:space-y-4">
                {topUsersMonth.length > 0 ? (
                  topUsersMonth.map((user, index) => (
                    <div key={user.roll} className="group">
                      <div className="relative overflow-hidden rounded-lg lg:rounded-xl p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 lg:space-x-4">
                            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm lg:text-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg truncate">
                                {user.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Roll: {user.roll} •{" "}
                                {getUserDisplayRole({ roll: user.roll })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg transform hover:scale-105 transition-all duration-200 nutrinos-badge-reduced">
                              <span className="lightning-icon text-xs">⚡</span>
                              <span className="font-extrabold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                                {user.thisMonthNutrinos.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                              This Month
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 lg:py-12">
                    <div className="text-4xl lg:text-6xl mb-4">🚀</div>
                    <p className="text-gray-500 dark:text-gray-400 text-base lg:text-lg">
                      Be the first to make your mark this month!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Trend Chart */}
          <div className="mb-6 lg:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6 flex items-center">
                <span className="text-xl sm:text-2xl lg:text-3xl mr-2 lg:mr-3">
                  📈
                </span>
                Community Activity Trend
              </h3>
              {Object.keys(monthlyActivity).length > 0 ? (
                <div className="h-80 sm:h-96 lg:h-[400px]">
                  <Line
                    data={getMonthlyChart()}
                    options={{ ...chartOptions, maintainAspectRatio: false }}
                  />
                </div>
              ) : (
                <div className="h-80 sm:h-96 lg:h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl lg:text-6xl mb-4">📊</div>
                    <p className="text-sm lg:text-base">
                      No data available yet
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
