'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { CodeSnippet } from '@/lib/helper/ultimate';
import { addNutrinos } from '@/lib/nutrinos-system';
import AuthUtils from '@/lib/auth-utils-secure';

const programmingLanguages = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#', 'PHP',
  'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Ruby', 'Scala', 'R', 'MATLAB',
  'SQL', 'HTML', 'CSS', 'SCSS', 'Assembly', 'Bash', 'PowerShell', 'Other'
];

const difficultyLevels = [
  { value: 'Not Applied', label: 'Not Applied' },
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' }
];

export default function AddCodeSnippetForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: '',
    codeSnippet: '',
    rollNumber: '',
    difficulty: 'Not Applied',
    tags: [],
    isPublic: true,
    date: new Date().toISOString(),
    uid: `uid-${Math.random().toString(36).slice(2, 11)}`,
    likesCount: 0,
    copiesCount: 0,
  });

  useEffect(() => {
    const currentUser = AuthUtils.getUserData();
    if (currentUser && currentUser.roll) {
      setFormData(prev => ({ ...prev, rollNumber: currentUser.roll }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check authentication using the same method as dashboard
    const currentUser = AuthUtils.getUserData();
    if (!currentUser || !currentUser.roll) {
      toast.error('Please log in first');
      router.push('/user/login');
      return;
    }

    // Update formData with current user info if not already set
    if (!formData.rollNumber) {
      setFormData(prev => ({ ...prev, rollNumber: currentUser.roll }));
    }

    setSubmitting(true);

    try {
      // Validate form data
      if (!formData.title.trim()) {
        toast.error('Title is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.description.trim()) {
        toast.error('Description is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.codeSnippet.trim()) {
        toast.error('Code snippet is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.language) {
        toast.error('Programming language is required');
        setSubmitting(false);
        return;
      }
      
      // Create and upload code snippet
      const cs = new CodeSnippet({
        ...formData,
        rollNumber: currentUser.roll || formData.rollNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const snippetId = await cs.push(currentUser.roll || formData.rollNumber);
      
      if (!snippetId) {
        throw new Error('Failed to get snippet ID');
      }

      // Award Nutrinos points
      try {
        await addNutrinos(
          currentUser.roll || formData.rollNumber,
          "snippet_add",
          "Code Snippet Added",
          {
            title: formData.title,
            language: formData.language,
            snippetId: snippetId
          }
        );
      } catch (nutritosError) {
        console.error("Failed to award Nutrinos points:", nutritosError);
        // Don't fail the whole operation for nutrinos error
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        language: '',
        codeSnippet: '',
        rollNumber: formData.rollNumber,
        difficulty: 'Not Applied',
        tags: [],
        isPublic: true,
        date: new Date().toISOString(),
        uid: `uid-${Math.random().toString(36).slice(2, 11)}`,
        likesCount: 0,
        copiesCount: 0,
      });

      setTagInput('');
      toast.success(`Code snippet "${formData.title}" uploaded successfully!`);
      router.push('/codelibrary');
    } catch (error) {
      console.error('Error submitting snippet:', error);
      toast.error(`Failed to upload snippet: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-600 dark:text-gray-400"></i>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              New Code Snippet
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100 dark:divide-gray-800">
          
          {/* Title Input */}
          <div className="px-3 py-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full text-xl font-semibold placeholder-gray-400 border-0 bg-transparent focus:outline-none focus:ring-0 resize-none"
              placeholder="Give your snippet a title..."
              required
            />
          </div>

          {/* Description */}
          <div className="px-3 py-4">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full placeholder-gray-400 border-0 bg-transparent focus:outline-none focus:ring-0 resize-none"
              placeholder="Describe what your code does..."
              required
            />
          </div>

          {/* Language and Year */}
          <div className="px-3 py-4">
            <div className="flex gap-3 flex-wrap">
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Language</option>
                {programmingLanguages.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                ))}
              </select>

              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficultyLevels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="px-3 py-4">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                placeholder="Add tags..."
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="text-blue-600 dark:text-blue-400 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Code Input */}
          <div className="px-3 py-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {formData.language || 'Code'}
                </span>
              </div>
              <textarea
                name="codeSnippet"
                value={formData.codeSnippet}
                onChange={handleChange}
                rows="12"
                className="w-full p-3 font-mono text-sm bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                placeholder="// Paste your code here..."
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-3 py-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-full font-medium transition-colors ${
                submitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </span>
              ) : (
                'Share Code Snippet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}