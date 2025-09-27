'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, get, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';

// Password for admin access
const ADMIN_PASSWORD = 'bittoismad';

export default function AdminMaintainPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resourcesData, setResourcesData] = useState([]);
  const [editingResource, setEditingResource] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const router = useRouter();

  // Initial resources structure with semester-based links (1-1, 1-2, etc.) with A, B, C variants
  const initialResourcesStructure = [
    { 
      id: 1, 
      title: "1st Year Resources", 
      description: "Just entered the matrix? Here's your starter pack: C programming, logic gates, and enough math to question your existence. Escape infinite loops early!",
      semesters: [
        {
          id: "1-1",
          name: "1-1",
          links: [
            { id: 1, label: "A", url: "1xbyCdj3XQ9AsCCF8ImI13HCo25JEhgUJ" }, // Store drive ID, not full URL
            { id: 2, label: "B", url: "" },
            { id: 3, label: "C", url: "" }
          ]
        },
        {
          id: "1-2",
          name: "1-2", 
          links: [
            { id: 4, label: "A", url: "" },
            { id: 5, label: "B", url: "" },
            { id: 6, label: "C", url: "" }
          ]
        }
      ]
    },
    { 
      id: 2, 
      title: "2nd Year Resources", 
      description: "You've compiled your basics — now get ready for bugs that don't show errors! Dive into 'why won't this code run?!' energy.",
      semesters: [
        {
          id: "2-1",
          name: "2-1",
          links: [
            { id: 7, label: "A", url: "" },
            { id: 8, label: "B", url: "" },
            { id: 9, label: "C", url: "" }
          ]
        },
        {
          id: "2-2",
          name: "2-2",
          links: [
            { id: 10, label: "A", url: "" },
            { id: 11, label: "B", url: "" },
            { id: 12, label: "C", url: "" }
          ]
        }
      ]
    },
    { 
      id: 3, 
      title: "3rd Year Resources", 
      description: "Code is life now. OS deadlocks, Git merge conflicts, and your first real project where 'it works on my machine' is a valid excuse. Enjoy the chaos!",
      semesters: [
        {
          id: "3-1",
          name: "3-1",
          links: [
            { id: 13, label: "A", url: "" },
            { id: 14, label: "B", url: "" },
            { id: 15, label: "C", url: "" }
          ]
        },
        {
          id: "3-2",
          name: "3-2",
          links: [
            { id: 16, label: "A", url: "" },
            { id: 17, label: "B", url: "" },
            { id: 18, label: "C", url: "" }
          ]
        }
      ]
    },
    { 
      id: 4, 
      title: "4th Year Resources", 
      description: "You're almost out! But wait — there's ML models, thesis panic, final year projects, and last-minute internship hunts. Now's the time to pretend you know everything.",
      semesters: [
        {
          id: "4-1",
          name: "4-1",
          links: [
            { id: 19, label: "A", url: "" },
            { id: 20, label: "B", url: "" },
            { id: 21, label: "C", url: "" }
          ]
        },
        {
          id: "4-2",
          name: "4-2",
          links: [
            { id: 22, label: "A", url: "" },
            { id: 23, label: "B", url: "" },
            { id: 24, label: "C", url: "" }
          ]
        }
      ]
    },
    { 
      id: 5, 
      title: "Higher Studies & Internship Details", 
      description: "Want to escape the 9-to-5 matrix? Whether it's GRE stress or internship ghosting — we got the hacks. Also, don't forget to update your LinkedIn.",
      semesters: [
        {
          id: "higher-studies",
          name: "Resources",
          links: [
            { id: 25, label: "Higher Studies", url: "" },
            { id: 26, label: "Internships", url: "" },
            { id: 27, label: "Career Guide", url: "" }
          ]
        }
      ]
    }
  ];

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if admin password is stored in sessionStorage
        const storedPassword = sessionStorage.getItem('adminPassword');
        if (storedPassword === ADMIN_PASSWORD) {
          setIsAuthorized(true);
          const userData = localStorage.getItem('user');
          if (userData) {
            setCurrentUser(JSON.parse(userData));
          } else {
            setCurrentUser({ name: 'Admin User', roll: 'admin' });
          }
        } else {
          setShowPasswordPrompt(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError('Authentication error occurred.');
        setShowPasswordPrompt(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminPassword', passwordInput);
      setIsAuthorized(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      } else {
        setCurrentUser({ name: 'Admin User', roll: 'admin' });
      }
    } else {
      setError('Incorrect password. Access denied.');
      setPasswordInput('');
    }
  };

  // Load resources data from Firebase
  useEffect(() => {
    if (!isAuthorized) return;

    loadResourcesData();
  }, [isAuthorized]);

  const loadResourcesData = async () => {
    try {
      // Load all semester links from Firebase
      const resourcesRef = ref(db, 'resources');
      const snapshot = await get(resourcesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convert Firebase structure to our component structure
        const updatedResources = initialResourcesStructure.map(resource => {
          const updatedSemesters = resource.semesters.map(semester => {
            const semesterData = data[semester.id] || {};
            const updatedLinks = semester.links.map(link => ({
              ...link,
              url: semesterData[link.label] || ''
            }));
            
            return {
              ...semester,
              links: updatedLinks
            };
          });
          
          return {
            ...resource,
            semesters: updatedSemesters
          };
        });
        
        setResourcesData(updatedResources);
      } else {
        // Initialize with empty structure
        setResourcesData(initialResourcesStructure);
      }
    } catch (error) {
      setError('Failed to load resources data: ' + error.message);
    }
  };

  const saveResourcesData = async (newResourcesData) => {
    try {
      // Save individual links to Firebase with structure resources/1-1/A, etc.
      const updates = {};
      
      newResourcesData.forEach(resource => {
        resource.semesters?.forEach(semester => {
          semester.links?.forEach(link => {
            const path = `resources/${semester.id}/${link.label}`;
            updates[path] = link.url || null; // null removes empty links
          });
        });
      });
      
      await update(ref(db), updates);
      setResourcesData(newResourcesData);
      setSuccess('Resources updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save resources: ' + error.message);
    }
  };

  const addLink = (resourceId, semesterId, link) => {
    const updatedResources = resourcesData.map(resource => {
      if (resource.id === resourceId) {
        const updatedSemesters = resource.semesters.map(semester => {
          if (semester.id === semesterId) {
            const existingLinksCount = semester.links.filter(l => l.url).length;
            if (existingLinksCount >= 3) {
              setError('Maximum 3 links allowed per semester');
              return semester;
            }
            return {
              ...semester,
              links: semester.links.map(l => 
                l.label === link.label ? { ...l, url: link.url } : l
              )
            };
          }
          return semester;
        });
        return { ...resource, semesters: updatedSemesters };
      }
      return resource;
    });
    saveResourcesData(updatedResources);
  };

  const updateLink = (resourceId, semesterId, linkLabel, updatedLink) => {
    const updatedResources = resourcesData.map(resource => {
      if (resource.id === resourceId) {
        const updatedSemesters = resource.semesters.map(semester => {
          if (semester.id === semesterId) {
            return {
              ...semester,
              links: semester.links.map(link =>
                link.label === linkLabel ? { ...link, url: updatedLink.url } : link
              )
            };
          }
          return semester;
        });
        return { ...resource, semesters: updatedSemesters };
      }
      return resource;
    });
    saveResourcesData(updatedResources);
  };

  const deleteLink = (resourceId, semesterId, linkLabel) => {
    const updatedResources = resourcesData.map(resource => {
      if (resource.id === resourceId) {
        const updatedSemesters = resource.semesters.map(semester => {
          if (semester.id === semesterId) {
            return {
              ...semester,
              links: semester.links.map(link =>
                link.label === linkLabel ? { ...link, url: '' } : link
              )
            };
          }
          return semester;
        });
        return { ...resource, semesters: updatedSemesters };
      }
      return resource;
    });
    saveResourcesData(updatedResources);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-blue-500 text-6xl mb-4">�</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
            <p className="text-gray-600">Enter the admin password to access the maintenance panel</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Invalid admin credentials. Please contact the administrator.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <button
            onClick={() => {
              sessionStorage.removeItem('adminPassword');
              setShowPasswordPrompt(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Maintenance Panel</h1>
              <p className="text-sm text-gray-600">Manage drive links for resources page</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Admin: {currentUser?.name}</p>
              <p className="text-xs text-gray-500">Roll: {currentUser?.roll}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
            <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Resources Management */}
        <div className="space-y-6">
          {resourcesData.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onAddLink={addLink}
              onUpdateLink={updateLink}
              onDeleteLink={deleteLink}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Resource Card Component for Semester-based Management
function ResourceCard({ resource, onAddLink, onUpdateLink, onDeleteLink }) {
  const [editingLink, setEditingLink] = useState(null);

  const handleUpdateLink = (e, resourceId, semesterId, linkLabel) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const driveId = formData.get('driveId');
    
    if (!driveId) {
      alert('Please enter a Drive ID');
      return;
    }
    
    onUpdateLink(resourceId, semesterId, linkLabel, { url: driveId });
    setEditingLink(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{resource.title}</h2>
      </div>

      {/* Semesters */}
      <div className="space-y-6">
        {resource.semesters?.map((semester) => (
          <div key={semester.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{semester.name}</h3>
            
            {/* Links for this semester */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {semester.links?.map((link) => (
                <div key={link.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{semester.name} - {link.label}</span>
                    <div className="flex gap-2">
                      {link.url && (
                        <button
                          onClick={() => setEditingLink(`${resource.id}-${semester.id}-${link.label}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      )}
                      {link.url && (
                        <button
                          onClick={() => onDeleteLink(resource.id, semester.id, link.label)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {editingLink === `${resource.id}-${semester.id}-${link.label}` ? (
                    <form onSubmit={(e) => handleUpdateLink(e, resource.id, semester.id, link.label)}>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Drive ID</label>
                        <input
                          type="text"
                          name="driveId"
                          defaultValue={link.url}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter Google Drive ID"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Example: 1xbyCdj3XQ9AsCCF8ImI13HCo25JEhgUJ
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLink(null)}
                            className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {link.url ? (
                        <div>
                          <p className="text-sm text-gray-600 break-all">Drive ID: {link.url}</p>
                          <p className="text-xs text-blue-600 break-all">Will show as: /drive/{link.url}</p>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                            Active
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const driveId = formData.get('driveId');
                          if (driveId) {
                            onAddLink(resource.id, semester.id, { label: link.label, url: driveId });
                            e.target.reset();
                          }
                        }}>
                          <input
                            type="text"
                            name="driveId"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                            placeholder="Enter Google Drive ID"
                            required
                          />
                          <p className="text-xs text-gray-500 mb-2">
                            Example: 1xbyCdj3XQ9AsCCF8ImI13HCo25JEhgUJ
                          </p>
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                          >
                            Add Link
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}