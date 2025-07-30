"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { isAuthorizedReviewer } from "@/lib/auth-utils";
import { calculateSolverPoints } from "@/lib/points-system";
import toast, { Toaster } from "react-hot-toast";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";

const ReviewerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [solution, setSolution] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [solutionAttachments, setSolutionAttachments] = useState([]);
  const [expandedSnippets, setExpandedSnippets] = useState({});
  
  const maxCodeLines = 20;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Check if user is authorized reviewer using utility function
    if (!isAuthorizedReviewer(parsedUser)) {
      toast.error("Access denied. You are not authorized to access this dashboard.");
      router.push("/user/dashboard");
      return;
    }

    setUser(parsedUser);
    loadDoubts();
  }, [router]);

  useEffect(() => {
    // Highlight code blocks after component renders
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  const loadDoubts = () => {
    setLoading(true);
    try {
      const doubtsRef = ref(db, "doubts");
      onValue(doubtsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const doubtsArray = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key]
            }))
            .filter(doubt => doubt.status === "pending" || doubt.status === "assigned")
            .sort((a, b) => b.timestamp - a.timestamp);
          
          setDoubts(doubtsArray);
        } else {
          setDoubts([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error loading doubts:", error);
      toast.error("Failed to load doubts");
      setLoading(false);
    }
  };

  const assignDoubtToMe = async (doubtId) => {
    try {
      const doubtRef = ref(db, `doubts/${doubtId}`);
      await update(doubtRef, {
        status: "assigned",
        assignedTo: {
          name: user.name,
          roll: user.roll,
          assignedAt: Date.now()
        }
      });
      toast.success("Doubt assigned to you!");
    } catch (error) {
      console.error("Error assigning doubt:", error);
      toast.error("Failed to assign doubt");
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Check file size (100KB = 100 * 1024 bytes)
      if (file.size > 100 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 100KB.`);
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'text/plain'
      ];
      
      const allowedExtensions = [
        '.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.cpp', '.c', '.java',
        '.html', '.css', '.json', '.xml', '.sql', '.php', '.rb', '.go',
        '.rs', '.swift', '.kt', '.scala', '.sh', '.bat', '.ps1'
      ];

      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const isAllowed = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

      if (!isAllowed) {
        toast.error(`File ${file.name} type is not allowed. Only images and code files are supported.`);
        return;
      }

      // Read file content
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        // For images, read as data URL
        reader.onload = (event) => {
          const newAttachment = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'image',
            content: event.target.result,
            size: file.size,
            mimeType: file.type
          };
          setSolutionAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      } else {
        // For text/code files, read as text
        reader.onload = (event) => {
          const newAttachment = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'code',
            content: event.target.result,
            size: file.size,
            mimeType: file.type
          };
          setSolutionAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsText(file);
      }
    });

    // Clear the input
    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setSolutionAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const submitSolution = async () => {
    if (!solution.trim()) {
      toast.error("Please provide a solution");
      return;
    }

    setSubmittingSolution(true);
    try {
      // Clean solution attachments to remove undefined properties
      const cleanAttachments = solutionAttachments.map(attachment => {
        const cleanAttachment = {
          id: attachment.id,
          name: attachment.name,
          content: attachment.content,
          type: attachment.type
        };
        // Only add data property if it exists (for images)
        if (attachment.data) {
          cleanAttachment.data = attachment.data;
        }
        return cleanAttachment;
      });

      const solvedAt = Date.now();
      const assignedAt = selectedDoubt.assignedTo?.assignedAt || solvedAt;
      
      // Calculate initial points (will be updated when user marks as satisfied)
      const initialPoints = calculateSolverPoints(
        solution.trim(),
        cleanAttachments,
        assignedAt,
        solvedAt,
        false // Initial calculation assumes not satisfied yet
      );

      const doubtRef = ref(db, `doubts/${selectedDoubt.id}`);
      
      // Update doubt with solution
      await update(doubtRef, {
        status: "resolved",
        solution: {
          content: solution.trim(),
          attachments: cleanAttachments,
          solvedBy: {
            name: user.name,
            roll: user.roll
          },
          solvedAt: solvedAt,
          assignedAt: assignedAt,
          initialPoints: initialPoints,
          finalPoints: null // Will be set when user marks as satisfied
        }
      });

      // Move resolved doubt to archive
      const archiveRef = ref(db, `resolvedDoubts/${selectedDoubt.id}`);
      const archiveData = {
        ...selectedDoubt,
        status: "resolved",
        solution: {
          content: solution.trim(),
          attachments: cleanAttachments,
          solvedBy: {
            name: user.name,
            roll: user.roll
          },
          solvedAt: solvedAt,
          assignedAt: assignedAt,
          initialPoints: initialPoints,
          finalPoints: null
        }
      };
      
      await update(archiveRef, archiveData);

      // Notify the user that their doubt has been solved
      try {
        await fetch("/api/doubt-notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "notify_solution",
            doubtId: selectedDoubt.id,
            userId: selectedDoubt.userDetails.roll,
          }),
        });
      } catch (notifError) {
        console.error("Failed to notify user:", notifError);
      }

      toast.success("Solution submitted successfully! User will be notified.");
      setSelectedDoubt(null);
      setSolution("");
      setSolutionAttachments([]);
      
    } catch (error) {
      console.error("Error submitting solution:", error);
      toast.error("Failed to submit solution");
    } finally {
      setSubmittingSolution(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Environment bug": "bg-red-100 text-red-800",
      "Code not running": "bg-orange-100 text-orange-800",
      "Compiler error": "bg-yellow-100 text-yellow-800",
      "Debug my code": "bg-blue-100 text-blue-800",
      "Give me hint": "bg-green-100 text-green-800",
      "Explain the idea": "bg-purple-100 text-purple-800",
      "Explain the code": "bg-pink-100 text-pink-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const toggleExpand = (id) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    // Re-highlight after state change and DOM update
    setTimeout(() => {
      const codeBlocks = document.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        // Remove existing highlighting classes
        block.removeAttribute('data-highlighted');
        block.className = block.className.replace(/hljs[^\s]*/g, '').trim();
        // Re-apply highlighting
        hljs.highlightElement(block);
      });
    }, 100);
  };

  const isCodeLong = (code) => {
    return code?.split("\n").length > maxCodeLines;
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen dark:bg-gray-900 dark:text-gray-200">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="max-w-[95%] sm:max-w-7xl mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">Code Reviewers Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Help coders/programmers with their coding doubts</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading doubts...</div>
          </div>
        ) : doubts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No pending doubts</h2>
            <p className="text-gray-500 dark:text-gray-400">All doubts have been resolved. Great work!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Doubts List */}
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Pending Doubts ({doubts.length})
              </h2>
              
              {doubts.map((doubt) => (
                <div key={doubt.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base sm:text-lg truncate pr-2">{doubt.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium self-start ${getCategoryColor(doubt.category)}`}>
                      {doubt.category}
                    </span>
                  </div>
                  
                  <div className="mb-3 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Coder:</strong> {doubt.userDetails.name} ({doubt.userDetails.roll})
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Submitted:</strong> {formatDate(doubt.timestamp)}
                    </p>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 text-sm sm:text-base">{doubt.description}</p>

                  {doubt.attachment && (
                    <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        📎 Attachment: {doubt.attachment.name}
                      </p>
                      {doubt.attachment.type === 'image' ? (
                        <div className="mt-2">
                          <img 
                            src={doubt.attachment.data || `data:image/*;base64,${doubt.attachment.content}`} 
                            alt={doubt.attachment.name}
                            className="w-full max-w-32 h-auto max-h-20 rounded object-cover cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDoubt(doubt)}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {doubt.attachment.type === 'code' ? '📄 Code file' : '📄 Text file'}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    {doubt.status === "pending" ? (
                      <button
                        onClick={() => assignDoubtToMe(doubt.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm"
                      >
                        Take This Doubt
                      </button>
                    ) : doubt.assignedTo?.roll === user.roll ? (
                      <button
                        onClick={() => setSelectedDoubt(doubt)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-sm"
                      >
                        Solve This Doubt
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm text-center">
                        Assigned to {doubt.assignedTo?.name}
                      </span>
                    )}
                    
                    <button
                      onClick={() => setSelectedDoubt(doubt)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Solution Panel */}
            {selectedDoubt && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 h-fit lg:sticky lg:top-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Solve Doubt</h2>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">{selectedDoubt.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getCategoryColor(selectedDoubt.category)}`}>
                    {selectedDoubt.category}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Coder Details:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDoubt.userDetails.name} ({selectedDoubt.userDetails.roll})
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Problem Description:</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedDoubt.description}
                    </p>
                  </div>
                </div>

                {selectedDoubt.attachment && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Coder's Attachment:</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📎 {selectedDoubt.attachment.name}
                      </p>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                        {selectedDoubt.attachment.type === 'image' ? (
                          <div>
                            <img 
                              src={selectedDoubt.attachment.data || `data:image/*;base64,${selectedDoubt.attachment.content}`} 
                              alt={selectedDoubt.attachment.name}
                              className="max-w-full h-auto max-h-48 sm:max-h-64 rounded cursor-pointer hover:opacity-80"
                              onClick={() => window.open(selectedDoubt.attachment.data || `data:image/*;base64,${selectedDoubt.attachment.content}`, '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="code-container dark:bg-gray-900 bg-gray-200 rounded-lg overflow-hidden relative group">
                            <pre
                              className={`p-4 overflow-x-auto transition-transform duration-500 ${
                                isCodeLong(selectedDoubt.attachment.content) &&
                                !expandedSnippets[`doubt-${selectedDoubt.id}`]
                                  ? "max-h-70"
                                  : ""
                              }`}
                            >
                              <code
                                className={`language-javascript`}
                              >
                                {isCodeLong(selectedDoubt.attachment.content) &&
                                !expandedSnippets[`doubt-${selectedDoubt.id}`]
                                  ? selectedDoubt.attachment.content
                                      .split("\n")
                                      .slice(0, maxCodeLines)
                                      .join("\n") + "\n..."
                                  : selectedDoubt.attachment.content}
                              </code>
                            </pre>

                            {/* Code expand button */}
                            {isCodeLong(selectedDoubt.attachment.content) && (
                              <div className="flex justify-center p-2">
                                <button
                                  className="px-6 py-2 text-sm font-medium rounded-full mx-auto dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 bg-gray-300 hover:bg-gray-400 text-gray-600 transition-colors duration-300"
                                  onClick={() => {
                                    // Remove highlighting before animation
                                    const codeBlocks = document.querySelectorAll('pre code');
                                    codeBlocks.forEach((block) => {
                                      block.removeAttribute('data-highlighted');
                                      block.className = block.className.replace(/hljs[^\s]*/g, '').trim();
                                    });
                                    toggleExpand(`doubt-${selectedDoubt.id}`);
                                  }}
                                >
                                  {expandedSnippets[`doubt-${selectedDoubt.id}`]
                                    ? "Collapse "
                                    : "Expand "}
                                  Code
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="solution" className="block font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    Your Solution:
                  </label>
                  <textarea
                    id="solution"
                    rows={8}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Provide a detailed solution, explanation, or code fix..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <label htmlFor="solution-files" className="block font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    Attachments (Optional):
                  </label>
                  <input
                    type="file"
                    id="solution-files"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,.txt,.js,.jsx,.ts,.tsx,.py,.cpp,.c,.java,.html,.css,.json,.xml,.sql,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.bat,.ps1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload images or code files (max 100KB each). Supports: JPG, PNG, GIF, WebP, TXT, JS, Python, C++, etc.
                  </p>
                  
                  {/* Display uploaded attachments */}
                  {solutionAttachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Files:</h5>
                      {solutionAttachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {attachment.type === 'image' ? (
                              <>
                                <i className="fas fa-image text-green-500 flex-shrink-0"></i>
                                <img 
                                  src={attachment.content} 
                                  alt={attachment.name}
                                  className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded flex-shrink-0"
                                />
                              </>
                            ) : (
                              <i className="fas fa-file-code text-blue-500 flex-shrink-0"></i>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{attachment.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(attachment.size / 1024)}KB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 flex-shrink-0 ml-2"
                            title="Remove attachment"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={submitSolution}
                    disabled={submittingSolution || !solution.trim()}
                    className={`flex-1 py-2 px-4 rounded text-white font-medium text-sm ${
                      submittingSolution || !solution.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    }`}
                  >
                    {submittingSolution ? "Submitting..." : "Submit Solution"}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedDoubt(null);
                      setSolution("");
                      setSolutionAttachments([]);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerDashboard;
