"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, push, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

// Authorized admin users who can add reviewers
const AUTHORIZED_ADMINS = ["2403142", "2403172", "2403129"];

export default function AddReviewer() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [existingReviewers, setExistingReviewers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    roll: "",
    email: "",
    department: "CSE",
    batch: "",
    permissions: {
      canReviewCode: true,
      canModerateDoubt: true,
      canDeletePosts: false,
      canBanUsers: false,
    },
    notes: "",
  });

  const router = useRouter();

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) {
          router.push("/user/login");
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);

        // Check if user is authorized admin
        if (AUTHORIZED_ADMINS.includes(user.roll)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/user/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch existing reviewers
  useEffect(() => {
    if (!isAuthorized) return;

    const reviewersRef = ref(db, "reviewers");
    const unsubscribe = onValue(reviewersRef, (snapshot) => {
      const reviewersData = snapshot.val() || {};
      const reviewersList = Object.entries(reviewersData).map(
        ([id, reviewer]) => ({
          id,
          ...reviewer,
        })
      );
      setExistingReviewers(reviewersList);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("permissions.")) {
      const permissionKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionKey]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return false;
    }
    if (!formData.roll.trim()) {
      setMessage({ type: "error", text: "Roll number is required" });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setMessage({ type: "error", text: "Valid email is required" });
      return false;
    }
    if (!formData.batch.trim()) {
      setMessage({ type: "error", text: "Batch is required" });
      return false;
    }

    // Check if reviewer already exists
    const existingReviewer = existingReviewers.find(
      (reviewer) =>
        reviewer.roll === formData.roll || reviewer.email === formData.email
    );
    if (existingReviewer) {
      setMessage({
        type: "error",
        text: "A reviewer with this roll number or email already exists",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const reviewersRef = ref(db, "reviewers");
      const newReviewerRef = push(reviewersRef);

      const reviewerData = {
        ...formData,
        addedBy: currentUser.roll,
        addedByName: currentUser.name,
        dateAdded: new Date().toISOString(),
        status: "active",
        totalReviews: 0,
        lastActive: null,
      };

      await set(newReviewerRef, reviewerData);

      setMessage({
        type: "success",
        text: `Successfully added ${formData.name} as a reviewer!`,
      });

      // Reset form
      setFormData({
        name: "",
        roll: "",
        email: "",
        department: "CSE",
        batch: "",
        permissions: {
          canReviewCode: true,
          canModerateDoubt: true,
          canDeletePosts: false,
          canBanUsers: false,
        },
        notes: "",
      });
    } catch (error) {
      console.error("Error adding reviewer:", error);
      setMessage({
        type: "error",
        text: "Failed to add reviewer. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You are not authorized to add reviewers. Only specific
            administrators can access this functionality.
          </p>
          <button
            onClick={() => router.push("/user/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                Add New Reviewer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new code reviewer to the system
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Admin: {currentUser?.name}
              </p>
              <p className="text-xs text-gray-500">Roll: {currentUser?.roll}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Reviewer Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Reviewer Information
              </h2>

              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="roll"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      id="roll"
                      name="roll"
                      value={formData.roll}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2403142"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="student@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Department
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CSE">
                        Computer Science & Engineering
                      </option>
                      <option value="EEE">
                        Electrical & Electronic Engineering
                      </option>
                      <option value="ME">Mechanical Engineering</option>
                      <option value="CE">Civil Engineering</option>
                      <option value="IPE">
                        Industrial & Production Engineering
                      </option>
                      <option value="URP">Urban & Regional Planning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="batch"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Batch *
                  </label>
                  <input
                    type="text"
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2024, 2023"
                    required
                  />
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    Permissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions.canReviewCode"
                        checked={formData.permissions.canReviewCode}
                        onChange={handleInputChange}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Can review code submissions
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions.canModerateDoubt"
                        checked={formData.permissions.canModerateDoubt}
                        onChange={handleInputChange}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Can moderate doubt posts
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions.canDeletePosts"
                        checked={formData.permissions.canDeletePosts}
                        onChange={handleInputChange}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Can delete posts
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions.canBanUsers"
                        checked={formData.permissions.canBanUsers}
                        onChange={handleInputChange}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Can ban users
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional notes about this reviewer..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push("/admin")}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Adding..." : "Add Reviewer"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Existing Reviewers Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Existing Reviewers ({existingReviewers.length})
              </h3>

              {existingReviewers.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviewers found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingReviewers.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {reviewer.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Roll: {reviewer.roll}
                          </p>
                          <p className="text-xs text-gray-500">
                            {reviewer.department} • Batch {reviewer.batch}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            reviewer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reviewer.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Reviews: {reviewer.totalReviews || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
