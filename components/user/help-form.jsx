"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";

const HelpForm = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    attachment: null
  });

  const categories = [
    "Environment bug",
    "Code not running", 
    "Compiler error",
    "Debug my code",
    "Give me hint",
    "Explain the idea",
    "Explain the code"
  ];

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user/login");
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file size (100KB = 100 * 1024 bytes)
      if (file.size > 100 * 1024) {
        toast.error("File size must be less than 100KB");
        e.target.value = "";
        return;
      }

      // Check if it's an image
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const isImage = imageTypes.includes(file.type);

      // Check if it's a code/text file
      const allowedTypes = [
        'text/plain',
        '.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.cpp', '.c', '.java',
        '.html', '.css', '.json', '.xml', '.sql', '.php', '.rb', '.go',
        '.rs', '.swift', '.kt', '.scala', '.sh', '.bat', '.ps1'
      ];

      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const isCodeFile = allowedTypes.includes(file.type) || allowedTypes.includes(fileExtension);

      if (!isImage && !isCodeFile) {
        toast.error("Only images (JPEG, PNG, GIF, WebP) and code/text files are allowed");
        e.target.value = "";
        return;
      }

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          attachment: {
            name: file.name,
            content: event.target.result,
            size: file.size,
            type: isImage ? 'image' : 'code',
            data: isImage ? event.target.result : undefined
          }
        }));
      };
      
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.category || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Clean attachment data to remove undefined properties
      let cleanAttachment = null;
      if (formData.attachment) {
        cleanAttachment = {
          name: formData.attachment.name,
          content: formData.attachment.content,
          size: formData.attachment.size,
          type: formData.attachment.type
        };
        // Only add data property if it exists (for images)
        if (formData.attachment.data) {
          cleanAttachment.data = formData.attachment.data;
        }
      }

      const doubtData = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        attachment: cleanAttachment,
        userDetails: {
          name: user.name,
          roll: user.roll,
          email: user.email || ""
        },
        timestamp: Date.now(),
        status: "pending", // pending, assigned, resolved
        assignedTo: null,
        solution: null,
        createdAt: new Date().toISOString()
      };

      // Save to Firebase
      const doubtsRef = ref(db, "doubts");
      const doubtResult = await push(doubtsRef, doubtData);

      // Notify reviewers about new doubt
      try {
        await fetch("/api/doubt-notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "notify_reviewers",
            doubtId: doubtResult.key,
          }),
        });
      } catch (notifError) {
        console.error("Failed to notify reviewers:", notifError);
      }

      toast.success("Your doubt has been submitted successfully!");
      
      // Reset form
      setFormData({
        title: "",
        category: "",
        description: "",
        attachment: null
      });
      
      // Clear file input
      const fileInput = document.getElementById("attachment");
      if (fileInput) fileInput.value = "";

      // Redirect to My Doubts section
      setTimeout(() => {
        router.push("/user/dashboard?tab=my-doubts");
      }, 1500); // Wait for toast to be visible

    } catch (error) {
      console.error("Error submitting doubt:", error);
      toast.error("Failed to submit doubt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Get Help with Your Code</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief description of your problem"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* User Details (Auto-detected) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Details (Auto-detected)
              </label>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm"><strong>Name:</strong> {user.name}</p>
                <p className="text-sm"><strong>Roll:</strong> {user.roll}</p>
                {user.email && <p className="text-sm"><strong>Email:</strong> {user.email}</p>}
              </div>
            </div>

            {/* Time (Auto-detected) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Time (Auto-detected)
              </label>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm">{new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">
                File Attachment (Optional - Max 100KB, images and code files)
              </label>
              <input
                type="file"
                id="attachment"
                onChange={handleFileChange}
                accept=".txt,.js,.jsx,.ts,.tsx,.py,.cpp,.c,.java,.html,.css,.json,.xml,.sql,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.bat,.ps1,.jpg,.jpeg,.png,.gif,.webp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.attachment && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700">
                    File attached: {formData.attachment.name} ({Math.round(formData.attachment.size / 1024)}KB)
                    {formData.attachment.type === 'image' && ' - Image'}
                    {formData.attachment.type === 'code' && ' - Code/Text'}
                  </p>
                  {formData.attachment.type === 'image' && (
                    <img 
                      src={formData.attachment.data} 
                      alt={formData.attachment.name}
                      className="mt-2 max-w-32 h-auto max-h-20 rounded border"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your problem in detail. Include error messages, what you've tried, and what you expect to happen."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                }`}
              >
                {loading ? "Submitting..." : "Submit Doubt"}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Submit your coding doubt using this form</li>
              <li>• Our code reviewers will be notified and work on solving it</li>
              <li>• You'll be notified when a solution is available</li>
              <li>• Once resolved, your doubt will be added to our searchable archive</li>
              <li>• Check existing doubts first to see if your question is already answered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpForm;
