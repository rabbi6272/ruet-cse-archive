'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, push, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// Admin password for developer access
const ADMIN_PASSWORD = 'bittoismad';

export default function AddDeveloper() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingDevelopers, setExistingDevelopers] = useState([]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Code Reviewer & Tester',
    location: '',
    roll: '',
    github: '',
    linkedin: '',
    facebook: '',
    image: '/public/images/developers/default.jpg' // Default image
  });

  const router = useRouter();

  // Role options for developers
  const roleOptions = [
    'Frontend & Backend Developer',
    'Security & Tester', 
    'Code Reviewer & Tester',
    'Media Team',
    'Suggestions & Resource Management'
  ];

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        
        // If no user data, still allow access to password prompt
        if (!userData) {
          setCurrentUser(null);
          setShowPasswordPrompt(true);
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);

        // Always show password prompt for developer access
        setShowPasswordPrompt(true);
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, still show password prompt instead of redirecting
        setCurrentUser(null);
        setShowPasswordPrompt(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle password verification
  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setMessage({ type: 'success', text: 'Access granted! You can now add developers.' });
    } else {
      setMessage({ type: 'error', text: 'Incorrect password. Please try again.' });
      setPasswordInput('');
    }
  };

  // Fetch existing developers from database
  useEffect(() => {
    if (!isAuthorized) return;

    const developersRef = ref(db, 'developers');
    const unsubscribe = onValue(developersRef, (snapshot) => {
      const developersData = snapshot.val() || {};
      const developersList = Object.entries(developersData).map(([id, developer]) => ({
        id,
        ...developer
      }));
      setExistingDevelopers(developersList);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return false;
    }
    if (!formData.location.trim()) {
      setMessage({ type: 'error', text: 'Location is required' });
      return false;
    }
    if (!formData.github.trim() && !formData.linkedin.trim() && !formData.facebook.trim()) {
      setMessage({ type: 'error', text: 'At least one social media link is required' });
      return false;
    }

    // Check if developer already exists
    const existingDeveloper = existingDevelopers.find(
      developer => developer.name.toLowerCase() === formData.name.toLowerCase() ||
                   (formData.roll && developer.roll === formData.roll)
    );
    if (existingDeveloper) {
      setMessage({ 
        type: 'error', 
        text: 'A developer with this name or roll number already exists' 
      });
      return false;
    }

    return true;
  };

  const generateUniqueId = () => {
    // Generate a unique ID for the developer
    const existingIds = existingDevelopers.map(d => d.id);
    let newId;
    let attempts = 0;
    
    do {
      const randomNum = Math.floor(Math.random() * 0xFFFF) + 0x300;
      newId = `dev_${randomNum.toString(16)}`;
      attempts++;
    } while (existingIds.includes(newId) && attempts < 100);
    
    return newId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const developersRef = ref(db, 'developers');
      const newDeveloperRef = push(developersRef);
      
      const developerData = {
        ...formData,
        id: generateUniqueId(),
        // Set default values for empty social links
        github: formData.github || '#',
        linkedin: formData.linkedin || '#',
        facebook: formData.facebook || '#',
        // Use default image path
        image: '/public/images/developers/default.jpg',
        addedBy: currentUser?.roll || 'guest',
        addedByName: currentUser?.name || 'Guest User',
        dateAdded: new Date().toISOString(),
        isDynamic: true
      };

      await set(newDeveloperRef, developerData);

      setMessage({ 
        type: 'success', 
        text: `Successfully added ${formData.name} to the development team!` 
      });

      // Reset form
      setFormData({
        name: '',
        role: 'Code Reviewer & Tester',
        location: '',
        roll: '',
        github: '',
        linkedin: '',
        facebook: '',
        image: '/public/images/developers/default.jpg'
      });

    } catch (error) {
      console.error('Error adding developer:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to add developer. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Show password prompt
    if (showPasswordPrompt) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
            <div className="text-blue-500 text-6xl mb-4 text-center">👨‍💻</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Developer Access Required</h1>
            <p className="text-gray-600 mb-6 text-center">
              Please enter the admin password to add developers to the team.
            </p>
            
            {message.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Access
                </button>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500 text-center">
              <p>Enter the admin password to access the developer management system.</p>
            </div>
          </div>
        </div>
      );
    }

    // Fallback access denied (shouldn't reach here with new flow)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You are not authorized to add developers.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Developer</h1>
              <p className="text-sm text-gray-600">Add a new developer to The Avengers team</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Admin: {currentUser?.name || 'Guest User'}</p>
              <p className="text-xs text-gray-500">Roll: {currentUser?.roll || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Add Developer Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Developer Information</h2>
              
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label htmlFor="roll" className="block text-sm font-medium text-gray-700 mb-2">
                      Roll Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="roll"
                      name="roll"
                      value={formData.roll}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2403142"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {roleOptions.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, Country"
                      required
                    />
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Social Media Links</h3>
                  <p className="text-sm text-gray-600 mb-4">At least one social media link is required. Use '#' for unavailable links.</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        id="github"
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://linkedin.com/in/profile"
                      />
                    </div>

                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                        Facebook Profile
                      </label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://facebook.com/profile"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Profile Image</h3>
                  <p className="text-sm text-gray-600">
                    📸 Default image will be used: <code className="bg-blue-100 px-2 py-1 rounded text-xs">/public/images/developers/default.jpg</code>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    To use a custom image, the admin needs to upload it to the developers folder and update the database manually.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Adding...' : 'Add Developer'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Existing Developers Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Database Developers ({existingDevelopers.length})
              </h3>
              
              {existingDevelopers.length === 0 ? (
                <p className="text-gray-500 text-sm">No developers in database yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingDevelopers.map((developer) => (
                    <div key={developer.id} className="border border-gray-200 rounded-lg p-3">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{developer.name}</h4>
                        <p className="text-xs text-gray-500">{developer.role}</p>
                        <p className="text-xs text-gray-500">{developer.location}</p>
                        {developer.roll && (
                          <p className="text-xs text-blue-600">Roll: {developer.roll}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Static Developers</h4>
              <p className="text-xs text-blue-700">
                There are also static developers in the code. 
                New developers added here will appear alongside them on the developers page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}