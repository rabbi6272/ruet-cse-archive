"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faThumbsDown, faExternalLinkAlt, faCode, faRobot } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ibmPlexSans } from "@/app/ui/fonts";
import AuthUtils from "@/lib/auth-utils-secure";
import toast from "react-hot-toast";

export function AppsBody() {
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState("popular");

  useEffect(() => {
    // Get current user
    const user = AuthUtils.getUserData();
    setCurrentUser(user);

    // Listen to published apps
    const appsRef = ref(db, 'publishedApps');
    const unsubscribe = onValue(appsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const appsArray = Object.entries(data).map(([key, app]) => ({
          id: key,
          ...app,
        }));
        setApps(appsArray);
      } else {
        setApps([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort apps based on selected filter
  useEffect(() => {
    let filtered = [...apps];
    
    switch (filter) {
      case "newest":
        filtered.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        break;
      case "popular":
        filtered.sort((a, b) => {
          const aScore = (a.upvotes || 0) - (a.downvotes || 0);
          const bScore = (b.upvotes || 0) - (b.downvotes || 0);
          if (aScore !== bScore) {
            return bScore - aScore;
          }
          return (b.publishedAt || 0) - (a.publishedAt || 0);
        });
        break;
      case "ai":
        filtered = filtered.filter(app => app.isAiUsed === "yes")
          .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        break;
      case "raw":
        filtered = filtered.filter(app => app.isAiUsed === "no")
          .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        break;
      default:
        break;
    }
    
    setFilteredApps(filtered);
  }, [apps, filter]);

  const handleVote = async (appId, voteType) => {
    if (!currentUser) {
      toast.error("Please log in to vote");
      return;
    }

    try {
      const appRef = ref(db, `publishedApps/${appId}`);
      const app = apps.find(a => a.id === appId);
      
      if (!app) return;

      const voters = app.voters || {};
      const userVote = voters[currentUser.roll];
      
      let newUpvotes = app.upvotes || 0;
      let newDownvotes = app.downvotes || 0;
      let newVoters = { ...voters };

      // Remove previous vote if exists
      if (userVote === 'up') {
        newUpvotes--;
      } else if (userVote === 'down') {
        newDownvotes--;
      }

      // Add new vote if different from previous or if no previous vote
      if (userVote !== voteType) {
        if (voteType === 'up') {
          newUpvotes++;
        } else {
          newDownvotes++;
        }
        newVoters[currentUser.roll] = voteType;
      } else {
        // Remove vote if clicking same vote type
        delete newVoters[currentUser.roll];
      }

      await update(appRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        voters: newVoters
      });

      toast.success(userVote === voteType ? "Vote removed" : "Vote recorded");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserVote = (app) => {
    if (!currentUser || !app.voters) return null;
    return app.voters[currentUser.roll] || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading apps...</p>
        </div>
      </div>
    );
  }

  if (filteredApps.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Apps (0)
            </h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter apps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="ai">AI-Powered</SelectItem>
                <SelectItem value="raw">Raw Code</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="mb-6">
            <FontAwesomeIcon icon={faCode} className="h-16 w-16 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {filter === "ai" ? "No AI-Powered Apps" : filter === "raw" ? "No Raw Code Apps" : "No Apps Published Yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === "ai" ? "No AI-powered applications found." : 
             filter === "raw" ? "No raw code applications found." :
             "Be the first to showcase your amazing project!"}
          </p>
          {filter !== "ai" && filter !== "raw" && (
            <Button variant="outline" asChild>
              <a href="/user/dashboard">Go to Dashboard</a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Apps ({filteredApps.length})
          </h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter apps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="ai">AI-Powered</SelectItem>
              <SelectItem value="raw">Raw Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredApps.map((app) => {
        const userVote = getUserVote(app);
        const score = (app.upvotes || 0) - (app.downvotes || 0);
        
        return (
          <Card key={app.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                  {app.appName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {app.isAiUsed === "yes" && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      <FontAwesomeIcon icon={faRobot} className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                  <Badge 
                    variant={score > 0 ? "default" : score < 0 ? "destructive" : "secondary"} 
                    className="text-xs"
                  >
                    {score > 0 ? `+${score}` : score}
                  </Badge>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>by <span className="font-medium">{app.authorName}</span> ({app.authorRoll})</p>
                <p className="text-xs mt-1">{formatDate(app.publishedAt)}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {app.purpose}
              </p>

              {app.isAiUsed === "yes" && app.aiPurpose && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faRobot} className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">AI Usage</span>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {app.aiPurpose}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={app.githubUrl} target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faGithub} className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                  {app.liveLink && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={app.liveLink} target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="h-4 w-4 mr-2" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                </div>

                {/* Voting */}
                <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(app.id, 'up')}
                    className={`flex items-center gap-2 ${
                      userVote === 'up' 
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                    }`}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} className="h-4 w-4" />
                    <span>{app.upvotes || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(app.id, 'down')}
                    className={`flex items-center gap-2 ${
                      userVote === 'down' 
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <FontAwesomeIcon icon={faThumbsDown} className="h-4 w-4" />
                    <span>{app.downvotes || 0}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}