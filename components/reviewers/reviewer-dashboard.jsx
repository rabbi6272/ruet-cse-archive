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

  const submitSolution = async () => {
    if (!solution.trim()) {
      toast.error("Please provide a solution");
      return;
    }

    setSubmittingSolution(true);
    try {
      const doubtRef = ref(db, `doubts/${selectedDoubt.id}`);
      
      // Update doubt with solution
      await update(doubtRef, {
        status: "resolved",
        solution: {
          content: solution.trim(),
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
                      <p className="text-sm font-medium text-gray-700">
                        📎 Attachment: {doubt.attachment.name}
                      </p>
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
                    <h4 className="font-medium text-gray-700 mb-2">Attachment:</h4>
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📎 {selectedDoubt.attachment.name}
                      </p>
                      <div className="bg-white p-2 rounded border max-h-48 overflow-y-auto">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {selectedDoubt.attachment.content}
                        </pre>
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
