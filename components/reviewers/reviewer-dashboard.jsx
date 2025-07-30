"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { isAuthorizedReviewer } from "@/lib/auth-utils";
import toast, { Toaster } from "react-hot-toast";

const ReviewerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [solution, setSolution] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [solutionAttachments, setSolutionAttachments] = useState([]);

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
          solvedAt: Date.now()
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
          solvedAt: Date.now()
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

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Code Reviewers Dashboard</h1>
          <p className="text-gray-600 mt-2">Help students with their coding doubts</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">Loading doubts...</div>
          </div>
        ) : doubts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No pending doubts</h2>
            <p className="text-gray-500">All doubts have been resolved. Great work!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Doubts List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pending Doubts ({doubts.length})
              </h2>
              
              {doubts.map((doubt) => (
                <div key={doubt.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg">{doubt.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doubt.category)}`}>
                      {doubt.category}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Student:</strong> {doubt.userDetails.name} ({doubt.userDetails.roll})
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Submitted:</strong> {formatDate(doubt.timestamp)}
                    </p>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">{doubt.description}</p>

                  {doubt.attachment && (
                    <div className="mb-4 p-2 bg-gray-50 border rounded">
                      <p className="text-sm font-medium text-gray-700 mb-1">
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
                        <p className="text-xs text-gray-500 mt-1">
                          {doubt.attachment.type === 'code' ? '📄 Code file' : '📄 Text file'}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {doubt.status === "pending" ? (
                      <button
                        onClick={() => assignDoubtToMe(doubt.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Take This Doubt
                      </button>
                    ) : doubt.assignedTo?.roll === user.roll ? (
                      <button
                        onClick={() => setSelectedDoubt(doubt)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Solve This Doubt
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                        Assigned to {doubt.assignedTo?.name}
                      </span>
                    )}
                    
                    <button
                      onClick={() => setSelectedDoubt(doubt)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Solution Panel */}
            {selectedDoubt && (
              <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Solve Doubt</h2>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700">{selectedDoubt.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getCategoryColor(selectedDoubt.category)}`}>
                    {selectedDoubt.category}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Student Details:</h4>
                  <p className="text-sm text-gray-600">
                    {selectedDoubt.userDetails.name} ({selectedDoubt.userDetails.roll})
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Problem Description:</h4>
                  <div className="bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedDoubt.description}
                    </p>
                  </div>
                </div>

                {selectedDoubt.attachment && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Student's Attachment:</h4>
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📎 {selectedDoubt.attachment.name}
                      </p>
                      <div className="bg-white p-2 rounded border">
                        {selectedDoubt.attachment.type === 'image' ? (
                          <div>
                            <img 
                              src={selectedDoubt.attachment.data || `data:image/*;base64,${selectedDoubt.attachment.content}`} 
                              alt={selectedDoubt.attachment.name}
                              className="max-w-full h-auto max-h-64 rounded cursor-pointer hover:opacity-80"
                              onClick={() => window.open(selectedDoubt.attachment.data || `data:image/*;base64,${selectedDoubt.attachment.content}`, '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                              {selectedDoubt.attachment.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="solution" className="block font-medium text-gray-700 mb-2">
                    Your Solution:
                  </label>
                  <textarea
                    id="solution"
                    rows={8}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Provide a detailed solution, explanation, or code fix..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <label htmlFor="solution-files" className="block font-medium text-gray-700 mb-2">
                    Attachments (Optional):
                  </label>
                  <input
                    type="file"
                    id="solution-files"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,.txt,.js,.jsx,.ts,.tsx,.py,.cpp,.c,.java,.html,.css,.json,.xml,.sql,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.bat,.ps1"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload images or code files (max 100KB each). Supports: JPG, PNG, GIF, WebP, TXT, JS, Python, C++, etc.
                  </p>
                  
                  {/* Display uploaded attachments */}
                  {solutionAttachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Uploaded Files:</h5>
                      {solutionAttachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                          <div className="flex items-center space-x-2">
                            {attachment.type === 'image' ? (
                              <>
                                <i className="fas fa-image text-green-500"></i>
                                <img 
                                  src={attachment.content} 
                                  alt={attachment.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              </>
                            ) : (
                              <i className="fas fa-file-code text-blue-500"></i>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-700">{attachment.name}</p>
                              <p className="text-xs text-gray-500">{Math.round(attachment.size / 1024)}KB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove attachment"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={submitSolution}
                    disabled={submittingSolution || !solution.trim()}
                    className={`flex-1 py-2 px-4 rounded text-white font-medium ${
                      submittingSolution || !solution.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
