"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { addNutrinos } from "@/lib/nutrinos-system";

export function CodeSnippetForm() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "",
    codeSnippet: "",
    rollNumber: "",
    difficulty: "beginner",
    tags: [],
    isPublic: true,
    date: "",
    uid: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/user/login");
      } else {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        // Auto-populate roll number from localStorage
        setFormData((prev) => ({
          ...prev,
          rollNumber: user.roll,
          uid: `uid-${Math.random().toString(36).slice(2, 11)}`,
          date: new Date().toISOString(),
        }));
      }
    };

    checkAuth();
  }, [router]);

  const programmingLanguages = [
    "JavaScript",
    "Python",
    "Java",
    "C",
    "C++",
    "C#",
    "PHP",
    "Dart",
    "R",
    "SQL",
  ];

  const difficultyLevels = [
    { value: "1st", label: "1st year" },
    { value: "2nd", label: "2nd Year" },
    { value: "3rd", label: "3rd Year" },
    { value: "4th", label: "4th Year" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      router.push("/user/login");
      return;
    }

    setSubmitting(true);

    try {
      const snippetsRef = ref(db, "codeSnippets");
      await push(snippetsRef, {
        ...formData,
        createdAt: new Date().toISOString(),
      });

      // Award Nutrinos points for code snippet submission
      try {
        await addNutrinos(
          formData.rollNumber,
          "snippet_add",
          "Code Snippet Added",
          {
            title: formData.title,
            language: formData.language,
          }
        );
      } catch (nutritosError) {
        console.error("Failed to award Nutrinos points:", nutritosError);
        // Don't break the flow, just log the error
      }

      // Reset form (except roll number and auth-related fields)
      setFormData({
        title: "",
        description: "",
        language: "",
        codeSnippet: "",
        rollNumber: formData.rollNumber, // Keep the same roll number
        difficulty: "Not Applied",
        tags: [],
        isPublic: true,
        date: new Date().toISOString(),
        uid: `uid-${Math.random().toString(36).slice(2, 11)}`,
        likesCount: 0,
        copiesCount: 0,
      });

      setTagInput("");

      toast.success("Snippet submitted successfully!");
      router.push("/user/dashboard");

      // setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit snippet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-4 px-2 lg:px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 p-8">
            {/* Loading Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Verifying User
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we authenticate your account...
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            
            {/* Status indicators */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
                <span>Checking authentication status</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Validating user credentials</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span>Loading user profile</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 px-2 lg:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <i className="fas fa-code text-lg text-white"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Submit Code Snippet
          </h1>
          
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <i className="fas fa-file-code"></i>
              Code Snippet Details
            </h2>
            <p className="text-indigo-100 mt-1">Fill in the details below to share your code</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="form-group">
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
              <i className="fas fa-heading text-indigo-500"></i>
              Title *
            </label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 placeholder-gray-500 dark:placeholder-gray-400"
                required
                placeholder="Enter a descriptive title for your code snippet"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <i className="fas fa-asterisk text-red-400 text-xs"></i>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
              <i className="fas fa-align-left text-indigo-500"></i>
              Description *
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                required
                placeholder="Explain what this code does, how it works, and when to use it"
              />
              <div className="absolute top-4 right-4">
                <i className="fas fa-asterisk text-red-400 text-xs"></i>
              </div>
            </div>
          </div>

          {/* Roll Number */}
          <div className="form-group">
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
              <i className="fas fa-id-badge text-indigo-500"></i>
              Roll Number *
            </label>
            <div className="relative">
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75"
                required
                placeholder="Your roll number"
                readOnly
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <i className="fas fa-lock text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Language and Year Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language */}
            <div className="form-group">
              <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
                <i className="fas fa-code text-indigo-500"></i>
                Programming Language *
              </label>
              <div className="relative">
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select a programming language</option>
                  {programmingLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </div>
              </div>
            </div>

            {/* Difficulty/Year */}
            <div className="form-group">
              <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
                <i className="fas fa-graduation-cap text-indigo-500"></i>
                Academic Year *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {difficultyLevels.map((level) => (
                  <label 
                    key={level.value} 
                    className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                      formData.difficulty === level.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={level.value}
                      checked={formData.difficulty === level.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">{level.label}</span>
                    {formData.difficulty === level.value && (
                      <i className="fas fa-check ml-2 text-indigo-500"></i>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
              <i className="fas fa-tags text-indigo-500"></i>
              Tags
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Add tags"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleTagAdd())
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <i className="fas fa-hashtag text-gray-400"></i>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <i className="fas fa-hashtag mr-2 text-xs"></i>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 hover:scale-110"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Code Snippet */}
          <div className="form-group">
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300 font-semibold mb-2 text-base">
              <i className="fas fa-file-code text-indigo-500"></i>
              Code Snippet *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                  <i className="fas fa-code"></i>
                  <span>Paste your code here</span>
                </div>
              </div>
              <textarea
                name="codeSnippet"
                value={formData.codeSnippet}
                onChange={handleChange}
                rows="12"
                className="w-full px-4 py-12 font-mono text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                required
                placeholder="// Paste your code here"
              />
              <div className="absolute top-4 right-4">
                <i className="fas fa-asterisk text-red-400 text-xs"></i>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-group pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full relative overflow-hidden px-6 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Publishing Your Code...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <i className="fas fa-rocket text-xl"></i>
                  <span>Submit Code Snippet</span>
                  <i className="fas fa-arrow-right"></i>
                </span>
              )}
              
              {/* Animated background effect */}
              {!submitting && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              )}
            </button>
            
            {/* Success message area */}
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <i className="fas fa-info-circle mr-1"></i>
                Happy Coding</p>
            </div>
          </div>
        </form>
        
        {/* Footer */}
        
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
    </div>
  );
}
