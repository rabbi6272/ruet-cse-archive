"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import toast from "react-hot-toast";
import { addNutrinos } from "@/lib/nutrinos-system";

export function CodeSnippetForm() {
  const router = useRouter();
  const recaptchaRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
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

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const verifyRecaptcha = async (token) => {
    try {
      const response = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recaptchaToken: token }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return false;
    }
  };

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
    "TypeScript",
    "Swift",
    "Go",
    "Ruby",
    "Rust",
    "Kotlin",
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

    // Check if reCAPTCHA is completed (only if reCAPTCHA is enabled)
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    setSubmitting(true);

    try {
      // Verify reCAPTCHA first (only if reCAPTCHA is enabled)
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        const recaptchaValid = await verifyRecaptcha(recaptchaToken);

        if (!recaptchaValid) {
          toast.error("reCAPTCHA verification failed. Please try again.");
          // Reset reCAPTCHA
          if (recaptchaRef.current) {
            recaptchaRef.current.reset();
          }
          setRecaptchaToken(null);
          setSubmitting(false);
          return;
        }
      }

      const snippetsRef = ref(db, "codeSnippets");
      await push(snippetsRef, {
        ...formData,
        createdAt: new Date().toISOString(),
      });

      // Award Nutrinos points for code snippet submission
      try {
        await addNutrinos(formData.rollNumber, 'snippet_add', 'Code Snippet Added', {
          title: formData.title,
          language: formData.language
        });
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

      // Reset reCAPTCHA after successful submission
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);

      toast.success("Snippet submitted successfully!");
      router.push("/user/dashboard");

      // setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit snippet. Please try again.");
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg">
        <p className="text-center text-lg">Redirecting to login page...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 lg:px-6">
      <div className="max-w-3xl mx-auto p-5 bg-white dark:bg-slate-700  rounded-xl shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-gray-900 dark:text-gray-200 mb-8">
          Submit Code Snippet
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              required
              placeholder="Enter snippet title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              required
              placeholder="Explain what this code does"
            />
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Roll Number *
            </label>
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              required
              placeholder="Your roll number"
              readOnly // Make roll number read-only since it comes from auth
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Language *
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              required
            >
              <option value="">Select a language</option>
              {programmingLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Year *
            </label>
            <div className="flex space-x-6">
              {difficultyLevels.map((level) => (
                <label key={level.value} className="flex items-center">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level.value}
                    checked={formData.difficulty === level.value}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 transition duration-200"
                  />
                  <span className="ml-2 text-gray-800 dark:text-gray-300">
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Tags
            </label>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-black dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Add tags (press Enter)"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleTagAdd())
                }
              />
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-6 py-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition duration-200"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 transition duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Code Snippet */}
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-medium mb-1">
              Code Snippet *
            </label>
            <textarea
              name="codeSnippet"
              value={formData.codeSnippet}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg text-black dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              required
              placeholder="Paste your code here"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 transition duration-200"
            />
            <label
              htmlFor="isPublic"
              className="ml-2 text-gray-800 dark:text-gray-300"
            >
              Make this snippet public
            </label>
          </div>

          {/* reCAPTCHA */}
          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
            <>
              <div className="flex justify-center">
                <div className="transform scale-90 sm:scale-100">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={handleRecaptchaChange}
                    theme="light"
                  />
                </div>
              </div>

              {/* reCAPTCHA requirement message */}
              {!recaptchaToken && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center -mt-4 mb-4">
                  Complete the reCAPTCHA to proceed
                </p>
              )}
            </>
          )}

          {/* Development mode notice */}
          {!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
            <div className="flex justify-center">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
                ⚠️ Development mode: reCAPTCHA disabled
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              submitting ||
              (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken)
            }
            className={`w-full px-6 py-3 text-lg font-medium text-white rounded-lg transition-colors duration-200 ${
              submitting ||
              (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Snippet"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
