'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, push, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// Admin password for alumni access
const ADMIN_PASSWORD = 'bittoismad';

export default function AddAlumni() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingAlumni, setExistingAlumni] = useState([]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    dept: 'CSE',
    series: '',
    optional: '',
    address: '',
    country: '',
    badges: '',
    linkedinurl: '',
    coordinates: ['', ''] // [longitude, latitude]
  });

  const router = useRouter();

  // Badge options for the alumni
  const badgeOptions = [
    'teacher', 'highereducated', 'researcher', 'corporate', 
    'entrepreneur', 'teamleader', 'manager', 'recruiter'
  ];

  const departmentOptions = [
    'CSE', 'EEE', 'ME', 'CE', 'IPE', 'URP', 'ARCH', 'ChE', 'BECM'
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

        // Always show password prompt for alumni access
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
      setMessage({ type: 'success', text: 'Access granted! You can now add alumni.' });
    } else {
      setMessage({ type: 'error', text: 'Incorrect password. Please try again.' });
      setPasswordInput('');
    }
  };

  // Fetch existing alumni from database
  useEffect(() => {
    if (!isAuthorized) return;

    const alumniRef = ref(db, 'alumni');
    const unsubscribe = onValue(alumniRef, (snapshot) => {
      const alumniData = snapshot.val() || {};
      const alumniList = Object.entries(alumniData).map(([id, alumnus]) => ({
        id,
        ...alumnus
      }));
      setExistingAlumni(alumniList);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'longitude' || name === 'latitude') {
      const coordinateIndex = name === 'longitude' ? 0 : 1;
      setFormData(prev => ({
        ...prev,
        coordinates: prev.coordinates.map((coord, index) => 
          index === coordinateIndex ? value : coord
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBadgeChange = (badge, checked) => {
    const currentBadges = formData.badges ? formData.badges.split(',').filter(b => b.trim()) : [];
    
    if (checked) {
      if (!currentBadges.includes(badge)) {
        currentBadges.push(badge);
      }
    } else {
      const index = currentBadges.indexOf(badge);
      if (index > -1) {
        currentBadges.splice(index, 1);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      badges: currentBadges.join(',')
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return false;
    }
    if (!formData.series.trim()) {
      setMessage({ type: 'error', text: 'Graduation series/year is required' });
      return false;
    }
    if (!formData.address.trim()) {
      setMessage({ type: 'error', text: 'Address is required' });
      return false;
    }
    if (!formData.country.trim()) {
      setMessage({ type: 'error', text: 'Country is required' });
      return false;
    }
    if (!formData.coordinates[0] || !formData.coordinates[1]) {
      setMessage({ type: 'error', text: 'Both longitude and latitude coordinates are required' });
      return false;
    }
    
    // Validate coordinates are numbers
    const longitude = parseFloat(formData.coordinates[0]);
    const latitude = parseFloat(formData.coordinates[1]);
    
    if (isNaN(longitude) || isNaN(latitude)) {
      setMessage({ type: 'error', text: 'Coordinates must be valid numbers' });
      return false;
    }
    
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      setMessage({ type: 'error', text: 'Coordinates must be within valid ranges (Longitude: -180 to 180, Latitude: -90 to 90)' });
      return false;
    }

    return true;
  };

  const generateUniqueId = () => {
    // Generate a unique ID similar to the existing format (0x followed by hex)
    const existingIds = existingAlumni.map(a => a.Id || a.id);
    let newId;
    let attempts = 0;
    
    do {
      const randomNum = Math.floor(Math.random() * 0xFFFF) + 0x200; // Start from a higher number
      newId = `0x${randomNum.toString(16)}`;
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
      const alumniRef = ref(db, 'alumni');
      const newAlumnusRef = push(alumniRef);
      
      const alumniData = {
        ...formData,
        Id: generateUniqueId(),
        coordinates: [parseFloat(formData.coordinates[0]), parseFloat(formData.coordinates[1])],
        type: 'Point',
        addedBy: currentUser?.roll || 'guest',
        addedByName: currentUser?.name || 'Guest User',
        dateAdded: new Date().toISOString()
      };

      await set(newAlumnusRef, alumniData);

      setMessage({ 
        type: 'success', 
        text: `Successfully added ${formData.name} to the alumni network!` 
      });

      // Reset form
      setFormData({
        name: '',
        dept: 'CSE',
        series: '',
        optional: '',
        address: '',
        country: '',
        badges: '',
        linkedinurl: '',
        coordinates: ['', '']
      });

    } catch (error) {
      console.error('Error adding alumnus:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to add alumnus. Please try again.' 
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
    // Show password prompt instead of access denied
    if (showPasswordPrompt) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
            <div className="text-blue-500 text-6xl mb-4 text-center">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Admin Access Required</h1>
            <p className="text-gray-600 mb-6 text-center">
              Please enter the admin password to add alumni to the network.
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
              <p>Enter the admin password to access the alumni management system.</p>
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
            You are not authorized to add alumni. Only specific administrators can access this functionality.
          </p>
          <button
            onClick={() => router.push('/user/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
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
              <h1 className="text-2xl font-bold text-gray-900">Add New Alumni</h1>
              <p className="text-sm text-gray-600">Add a new alumni to the global network map</p>
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
          
          {/* Add Alumni Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Alumni Information</h2>
              
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
                    <label htmlFor="dept" className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      id="dept"
                      name="dept"
                      value={formData.dept}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="series" className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Series/Year *
                    </label>
                    <input
                      type="text"
                      id="series"
                      name="series"
                      value={formData.series}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2020, 2019"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="linkedinurl" className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      id="linkedinurl"
                      name="linkedinurl"
                      value={formData.linkedinurl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://linkedin.com/in/profile"
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, State/Province, Country"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Country name"
                      required
                    />
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude * 
                      <span className="text-xs text-gray-500">(-180 to 180)</span>
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.coordinates[0]}
                      onChange={handleInputChange}
                      step="any"
                      min="-180"
                      max="180"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., -74.0060"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude * 
                      <span className="text-xs text-gray-500">(-90 to 90)</span>
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.coordinates[1]}
                      onChange={handleInputChange}
                      step="any"
                      min="-90"
                      max="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 40.7128"
                      required
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                  💡 <strong>Tip:</strong> You can find coordinates using Google Maps - right-click on a location and select "What's here?" to get the coordinates.
                </div>

                {/* Professional Details */}
                <div>
                  <label htmlFor="optional" className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Details / Bio
                  </label>
                  <textarea
                    id="optional"
                    name="optional"
                    value={formData.optional}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Current position, company, achievements, etc."
                  />
                </div>

                {/* Badges */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Professional Badges
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {badgeOptions.map(badge => (
                      <label key={badge} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.badges.split(',').includes(badge)}
                          onChange={(e) => handleBadgeChange(badge, e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 capitalize">{badge}</span>
                      </label>
                    ))}
                  </div>
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
                    {submitting ? 'Adding...' : 'Add Alumni'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Existing Alumni Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Database Alumni ({existingAlumni.length})
              </h3>
              
              {existingAlumni.length === 0 ? (
                <p className="text-gray-500 text-sm">No alumni in database yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingAlumni.map((alumnus) => (
                    <div key={alumnus.id} className="border border-gray-200 rounded-lg p-3">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{alumnus.name}</h4>
                        <p className="text-xs text-gray-500">{alumnus.dept} • {alumnus.series}</p>
                        <p className="text-xs text-gray-500">{alumnus.country}</p>
                        {alumnus.badges && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {alumnus.badges.split(',').slice(0, 2).map(badge => (
                              <span key={badge} className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                {badge.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Static Alumni</h4>
              <p className="text-xs text-blue-700">
                There are also {existingAlumni.length > 0 ? '40+' : '40'} alumni in the static data file. 
                New alumni added here will appear alongside them on the map.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}