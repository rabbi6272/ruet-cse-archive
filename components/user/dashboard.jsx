"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
  update,
  remove,
} from "firebase/database";
import { getUserDisplayRole } from "@/lib/auth-utils";
import { getUserGroup } from "@/lib/group-utils";
import AuthUtils from "@/lib/auth-utils-secure";
import toast, { Toaster } from "react-hot-toast";
import NotificationCenter from "./NotificationCenter";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";
import {
  getUserNutrinos,
  recordDailyVisit,
  awardSnippetNutrinos,
  getUserNutrinosHistory,
} from "@/lib/nutrinos-system";
import { presenceTracker } from "@/lib/presence-tracker";
import { useP2PChat } from "@/components/providers/P2PChatProvider";
import P2PChat from "./P2PChat";
import GroupChat from "./GroupChat";
import { notificationSound } from "@/lib/notificationSound";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ibmPlexSans } from "@/app/ui/fonts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faCopy, faEye, faExternalLinkAlt, faCode, faRobot } from "@fortawesome/free-solid-svg-icons";
import AppPublishForm from "./AppPublishForm";

const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
  const router = useRouter();
  const { isP2PChatOpen, openP2PChat, closeP2PChat } = useP2PChat();
  const [user, setUser] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [userNutrinos, setUserNutrinos] = useState({
    totalNutrinos: 0,
    level: 1,
    rank: "Beginner",
  });
  const [showNutrinosHistory, setShowNutrinosHistory] = useState(false);
  const [showAppPublishForm, setShowAppPublishForm] = useState(false);
  const [nutrinosHistory, setNutrinosHistory] = useState([]);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const [prevGroupUnreadCount, setPrevGroupUnreadCount] = useState(0);
  const [pendingChatRequests, setPendingChatRequests] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'apps', or 'bookmarks'
  const [publishedApps, setPublishedApps] = useState([]);
  const [editingAppId, setEditingAppId] = useState(null);
  const [editAppForm, setEditAppForm] = useState({});

  // Get current user and load data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("Loading user data...");
        const currentUser = AuthUtils.getUserData();
        console.log("Current user:", currentUser);
        
        if (!currentUser) {
          console.log("No user found, redirecting to login");
          router.push("/user/login");
          return;
        }
        
        setUser(currentUser);
        setLoading(false); // Set loading false once we have user
        
        // Load user snippets
        const userSnippetsRef = query(
          ref(db, "snippets"),
          orderByChild("authorRoll"),
          equalTo(currentUser.roll)
        );
        
        onValue(userSnippetsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const snippetsArray = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
            setSnippets(snippetsArray.reverse());
          } else {
            setSnippets([]);
          }
        });

        // Load user published apps
        const userAppsRef = query(
          ref(db, "publishedApps"),
          orderByChild("authorRoll"),
          equalTo(currentUser.roll)
        );
        
        onValue(userAppsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const appsArray = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
            setPublishedApps(appsArray.reverse());
          } else {
            setPublishedApps([]);
          }
        });

        // Load nutrinos data in background
        try {
          const nutrinosData = await getUserNutrinos(currentUser.roll);
          setUserNutrinos(nutrinosData);
          
          // Load nutrinos history
          const history = await getUserNutrinosHistory(currentUser.roll);
          setNutrinosHistory(history);

          // Record daily visit
          await recordDailyVisit(currentUser.roll);

          // Setup presence tracking
          presenceTracker.currentUser = currentUser;
          presenceTracker.startTracking(currentUser.roll, currentUser.name, 'dashboard');
        } catch (nutrinossError) {
          console.warn("Error loading nutrinos data:", nutrinossError);
          // Don't block the UI for nutrinos errors
        }
        
      } catch (error) {
        console.error("Error loading user data:", error);
        setError(`Failed to load user data: ${error.message}`);
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  // Pagination
  const totalPages = Math.ceil(snippets.length / ITEMS_PER_PAGE);
  const paginatedSnippets = snippets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Edit handlers
  const handleEditClick = (snippet) => {
    setEditingId(snippet.id);
    setEditForm({
      title: snippet.title,
      description: snippet.description || "",
      language: snippet.language,
      code: snippet.code,
      tags: snippet.tags ? snippet.tags.join(", ") : "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveEdit = async () => {
    try {
      const snippetRef = ref(db, `snippets/${editingId}`);
      await update(snippetRef, {
        title: editForm.title,
        description: editForm.description,
        language: editForm.language,
        code: editForm.code,
        tags: editForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        updatedAt: Date.now(),
      });
      setEditingId(null);
      toast.success("Snippet updated successfully!");
    } catch (error) {
      console.error("Error updating snippet:", error);
      toast.error("Failed to update snippet");
    }
  };

  const handleDelete = async (snippetId) => {
    if (window.confirm("Are you sure you want to delete this snippet?")) {
      try {
        await remove(ref(db, `snippets/${snippetId}`));
        toast.success("Snippet deleted successfully!");
      } catch (error) {
        console.error("Error deleting snippet:", error);
        toast.error("Failed to delete snippet");
      }
    }
  };

  // App editing handlers
  const handleEditAppClick = (app) => {
    setEditingAppId(app.id);
    setEditAppForm({
      appName: app.appName,
      purpose: app.purpose,
      githubUrl: app.githubUrl,
      liveLink: app.liveLink || "",
      isAiUsed: app.isAiUsed,
      aiPurpose: app.aiPurpose || "",
    });
  };

  const handleEditAppChange = (e) => {
    setEditAppForm({
      ...editAppForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveAppEdit = async () => {
    try {
      // Validation
      if (!editAppForm.appName.trim() || !editAppForm.purpose.trim() || !editAppForm.githubUrl.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/;
      if (!githubUrlPattern.test(editAppForm.githubUrl)) {
        toast.error("Please enter a valid GitHub URL");
        return;
      }

      if (editAppForm.liveLink && !editAppForm.liveLink.startsWith('http')) {
        toast.error("Live link must start with http:// or https://");
        return;
      }

      if (editAppForm.isAiUsed === "yes" && !editAppForm.aiPurpose.trim()) {
        toast.error("Please specify how AI was used");
        return;
      }

      const appRef = ref(db, `publishedApps/${editingAppId}`);
      await update(appRef, {
        appName: editAppForm.appName,
        purpose: editAppForm.purpose,
        githubUrl: editAppForm.githubUrl,
        liveLink: editAppForm.liveLink,
        isAiUsed: editAppForm.isAiUsed,
        aiPurpose: editAppForm.aiPurpose,
        updatedAt: Date.now(),
      });
      setEditingAppId(null);
      toast.success("App updated successfully!");
    } catch (error) {
      console.error("Error updating app:", error);
      toast.error("Failed to update app");
    }
  };

  const handleDeleteApp = async (appId) => {
    if (window.confirm("Are you sure you want to delete this app?")) {
      try {
        await remove(ref(db, `publishedApps/${appId}`));
        toast.success("App deleted successfully!");
      } catch (error) {
        console.error("Error deleting app:", error);
        toast.error("Failed to delete app");
      }
    }
  };

  const toggleSnippetExpansion = (snippetId) => {
    setExpandedSnippets(prev => ({
      ...prev,
      [snippetId]: !prev[snippetId]
    }));
  };

  const isCodeTruncated = (code) => {
    const maxCodeLines = 10;
    return code?.split("\n").length > maxCodeLines;
  };

  if (loading) {
    return (
      <div className={`${ibmPlexSans.className} flex justify-center items-center h-screen`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${ibmPlexSans.className} flex justify-center items-center h-screen`}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Authentication required</p>
          <Button onClick={() => router.push("/user/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ibmPlexSans.className} min-h-screen bg-white dark:bg-gray-900`}>
      {/* Header Profile Section */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{user.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{user.roll}</span>
                  <span>•</span>
                  <span>{snippets.length} posts</span>
                  <Badge variant="outline" className="ml-2 text-xs">{userNutrinos.rank}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter userRoll={user?.roll} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Navigation Tabs */}
        <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant={activeTab === 'posts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('posts')}
                className="text-sm"
              >
                Posts ({snippets.length})
              </Button>
              <Button
                variant={activeTab === 'apps' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('apps')}
                className="text-sm"
              >
                Published Apps ({publishedApps.length})
              </Button>
              <Button
                variant={activeTab === 'bookmarks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('bookmarks')}
                className="text-sm"
              >
                Bookmarks
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'posts' && (
                <>
                  <Button asChild variant="outline" size="sm" className="text-blue-600">
                    <Link href="/user/create">
                      + New Post
                    </Link>
                  </Button>
                </>
              )}
              {activeTab === 'apps' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAppPublishForm(true)}
                    className="text-blue-600"
                  >
                    + Publish App
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNutrinosHistory(!showNutrinosHistory)}
                className="text-gray-500 dark:text-gray-400"
              >
                Activity
              </Button>
            </div>
          </div>
        </div>

        {/* Activity History Dropdown */}
        {showNutrinosHistory && (
          <div className="px-3 border-b border-gray-100 dark:border-gray-800 max-h-64 overflow-y-auto">
            {nutrinosHistory.length > 0 ? (
              nutrinosHistory.map((entry) => (
                <div key={entry.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {typeof entry.reason === "string" ? entry.reason : "Activity completed"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={entry.nutrinos >= 0 ? "default" : "destructive"} className="text-xs">
                    {entry.nutrinos >= 0 ? "+" : ""}{entry.nutrinos.toFixed(2)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">No activity yet</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="px-3 py-3 bg-red-50 border-b border-red-100 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : snippets.length === 0 ? (
              <div className="text-center py-16 px-3">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No code snippets yet</p>
                <p className="text-sm text-gray-400">Share your first code snippet with the community!</p>
              </div>
            ) : (
              paginatedSnippets.map((snippet) => (
              <div key={snippet.id} className="px-3 py-4">
                {editingId === snippet.id ? (
                  <div className="space-y-3">
                    <Input
                      name="title"
                      value={editForm.title}
                      onChange={handleEditChange}
                      placeholder="Title"
                      className="border-0 border-b border-gray-200 rounded-none px-0 focus:border-blue-500"
                    />
                    <Textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      placeholder="Description"
                      rows={2}
                      className="border-0 border-b border-gray-200 rounded-none px-0 resize-none"
                    />
                    <div className="flex gap-2">
                      <Select value={editForm.language} onValueChange={(value) => setEditForm({...editForm, language: value})}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="c">C</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        name="tags"
                        value={editForm.tags}
                        onChange={handleEditChange}
                        placeholder="Tags (comma separated)"
                        className="flex-1 h-8"
                      />
                    </div>
                    <Textarea
                      name="code"
                      value={editForm.code}
                      onChange={handleEditChange}
                      rows={8}
                      className="font-mono text-sm border border-gray-200 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} size="sm">Save</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{snippet.title}</h3>
                          <Badge variant="outline" className="text-xs">{snippet.language}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{snippet.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                          {snippet.tags && snippet.tags.length > 0 && (
                            <div className="flex gap-1">
                              {snippet.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-blue-500">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(snippet)}
                          className="h-8 w-8 p-0"
                        >
                          <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(snippet.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          {snippet.language}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(snippet.code)}
                          className="h-6 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <FontAwesomeIcon icon={faCopy} className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="relative">
                        {!expandedSnippets[snippet.id] && isCodeTruncated(snippet.code) ? (
                          <>
                            <pre className="p-3 text-sm overflow-x-auto bg-white dark:bg-gray-900">
                              <code 
                                className="text-gray-800 dark:text-gray-100"
                                dangerouslySetInnerHTML={{
                                  __html: hljs.highlightAuto(
                                    snippet.code.split("\n").slice(0, 10).join("\n")
                                  ).value,
                                }}
                              />
                            </pre>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent h-12 flex items-end justify-center pb-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSnippetExpansion(snippet.id)}
                                className="h-6 text-xs"
                              >
                                Show More
                              </Button>
                            </div>
                          </>
                        ) : (
                          <pre className="p-3 text-sm overflow-x-auto bg-white dark:bg-gray-900">
                            <code 
                              className="text-gray-800 dark:text-gray-100"
                              dangerouslySetInnerHTML={{
                                __html: hljs.highlightAuto(snippet.code).value,
                              }}
                            />
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Load More / Pagination */}
          {activeTab === 'posts' && snippets.length > ITEMS_PER_PAGE && (
            <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, snippets.length)} of {snippets.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        ) : activeTab === 'apps' ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : publishedApps.length === 0 ? (
              <div className="text-center py-16 px-3">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No published apps yet</p>
                <p className="text-sm text-gray-400">Share your first app with the community!</p>
              </div>
            ) : (
              publishedApps.map((app) => (
                <div key={app.id} className="px-3 py-4">
                  {editingAppId === app.id ? (
                    <div className="space-y-3">
                      <Input
                        name="appName"
                        value={editAppForm.appName}
                        onChange={handleEditAppChange}
                        placeholder="App Name"
                        className="border-0 border-b border-gray-200 rounded-none px-0 focus:border-blue-500"
                      />
                      <Textarea
                        name="purpose"
                        value={editAppForm.purpose}
                        onChange={handleEditAppChange}
                        placeholder="Purpose"
                        rows={2}
                        className="border-0 border-b border-gray-200 rounded-none px-0 resize-none"
                      />
                      <Input
                        name="githubUrl"
                        value={editAppForm.githubUrl}
                        onChange={handleEditAppChange}
                        placeholder="GitHub URL"
                        className="border-0 border-b border-gray-200 rounded-none px-0 focus:border-blue-500"
                      />
                      <Input
                        name="liveLink"
                        value={editAppForm.liveLink}
                        onChange={handleEditAppChange}
                        placeholder="Live Link (optional)"
                        className="border-0 border-b border-gray-200 rounded-none px-0 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <Select 
                          value={editAppForm.isAiUsed} 
                          onValueChange={(value) => setEditAppForm({...editAppForm, isAiUsed: value, aiPurpose: value === "no" ? "" : editAppForm.aiPurpose})}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="AI Used?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        {editAppForm.isAiUsed === "yes" && (
                          <Input
                            name="aiPurpose"
                            value={editAppForm.aiPurpose}
                            onChange={handleEditAppChange}
                            placeholder="How was AI used?"
                            className="flex-1 h-8"
                          />
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSaveAppEdit} className="h-8">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingAppId(null)} className="h-8">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🚀</div>
                          <div>
                            <h3 className={`font-semibold text-gray-900 dark:text-white ${ibmPlexSans.className}`}>
                              {app.appName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(app.publishedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {app.upvotes > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              👍 {app.upvotes}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditAppClick(app)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          >
                            <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteApp(app.id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300">
                        {app.purpose}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <a 
                          href={app.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <FontAwesomeIcon icon={faCode} className="w-3 h-3" />
                          Code
                        </a>
                        {app.liveLink && (
                          <a 
                            href={app.liveLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                            Live Demo
                          </a>
                        )}
                        {app.isAiUsed === "yes" && (
                          <Badge variant="outline" className="text-xs">
                            <FontAwesomeIcon icon={faRobot} className="w-3 h-3 mr-1" />
                            AI: {app.aiPurpose}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Empty state for bookmarks tab - now handled in resources page */
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">📚 Bookmarks</p>
            <p className="text-sm">Visit the Resources page to access your bookmarks</p>
          </div>
        )}
      </div>

      {/* Chat Components */}
      <P2PChat
        userRoll={user?.roll}
        userName={user?.name}
        isOpen={isP2PChatOpen}
        onClose={() => closeP2PChat()}
      />
      <GroupChat
        userRoll={user?.roll}
        userName={user?.name}
        isOpen={isGroupChatOpen}
        onClose={() => setIsGroupChatOpen(false)}
        onUnreadCountChange={(count) => setGroupUnreadCount(count)}
      />
      
      {/* App Publish Form */}
      <AppPublishForm 
        isOpen={showAppPublishForm}
        onClose={() => setShowAppPublishForm(false)}
        user={user}
      />

      <Toaster />
    </div>
  );
};

export default Dashboard;