"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, push, update, onValue, off, get } from "firebase/database";
import toast from "react-hot-toast";
import AuthUtils from "@/lib/auth-utils-secure";

// Poll creation modal component
const PollCreationModal = ({ isOpen, onClose, onCreatePoll, groupId }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [duration, setDuration] = useState(24); // hours
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    setIsCreating(true);
    try {
      const pollData = {
        question: question.trim(),
        options: validOptions.map(opt => ({
          text: opt.trim(),
          votes: 0,
          voters: {}
        })),
        createdBy: AuthUtils.getUserRoll(),
        createdByName: AuthUtils.getUserName(),
        createdAt: Date.now(),
        expiresAt: Date.now() + (duration * 60 * 60 * 1000),
        allowMultiple,
        isAnonymous,
        groupId,
        totalVotes: 0,
        isActive: true
      };

      await onCreatePoll(pollData);
      
      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setAllowMultiple(false);
      setDuration(24);
      setIsAnonymous(false);
      onClose();
      
      toast.success("Poll created successfully!");
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Poll
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Question */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Question *
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows="3"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {question.length}/200 characters
            </p>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Options *
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    maxLength={100}
                  />
                </div>
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
            
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mt-2"
              >
                <i className="fas fa-plus"></i>
                Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Poll Settings
            </h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Allow multiple selections
              </label>
              <button
                type="button"
                onClick={() => setAllowMultiple(!allowMultiple)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowMultiple ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    allowMultiple ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Show voter names
              </label>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !isAnonymous ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    !isAnonymous ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Poll Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={1}>1 Hour</option>
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>1 Day</option>
                <option value={48}>2 Days</option>
                <option value={168}>1 Week</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating && <i className="fas fa-spinner fa-spin"></i>}
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Poll edit modal component
const PollEditModal = ({ isOpen, onClose, onUpdatePoll, poll }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (poll && isOpen) {
      setQuestion(poll.question || "");
      setOptions(poll.options?.map(opt => opt.text) || ["", ""]);
      setAllowMultiple(poll.allowMultiple || false);
      setIsAnonymous(poll.isAnonymous || false);
    }
  }, [poll, isOpen]);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error("Poll question is required");
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedPollData = {
        question: question.trim(),
        options: validOptions.map(text => ({
          text: text.trim(),
          votes: poll.options.find(opt => opt.text === text.trim())?.votes || 0,
          voters: poll.options.find(opt => opt.text === text.trim())?.voters || {}
        })),
        allowMultiple,
        isAnonymous
      };

      await onUpdatePoll(poll.id, updatedPollData);
      onClose();
      toast.success("Poll updated successfully!");
    } catch (error) {
      console.error("Error updating poll:", error);
      toast.error("Failed to update poll");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Poll
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Question */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              placeholder="What would you like to ask?"
              maxLength="200"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {question.length}/200 characters
            </p>
          </div>

          {/* Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                    maxLength="100"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove option"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-allowMultiple"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="edit-allowMultiple" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Allow multiple selections
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="edit-isAnonymous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Anonymous voting
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUpdating && <i className="fas fa-spinner fa-spin"></i>}
              Update Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Poll display component
const PollDisplay = ({ poll, onVote, onClosePoll, currentUserRoll, isHistoryView = false, onEditPoll = null }) => {
  const [userVotes, setUserVotes] = useState(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Check if user has already voted
    const voted = new Set();
    poll.options.forEach((option, index) => {
      if (option.voters && option.voters[currentUserRoll]) {
        voted.add(index);
      }
    });
    setUserVotes(voted);
    setShowResults(voted.size > 0 || !poll.isActive);
  }, [poll, currentUserRoll]);

  const handleVote = async (optionIndex) => {
    if (!poll.isActive || isVoting) return;

    setIsVoting(true);
    try {
      let newVotes = new Set(userVotes);
      
      if (poll.allowMultiple) {
        // Toggle selection for multiple choice
        if (newVotes.has(optionIndex)) {
          newVotes.delete(optionIndex);
        } else {
          newVotes.add(optionIndex);
        }
      } else {
        // Single choice - replace selection
        newVotes = new Set([optionIndex]);
      }

      await onVote(poll.id, Array.from(newVotes));
      setUserVotes(newVotes);
      setShowResults(true);
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  const showVotersForOption = (optionIndex) => {
    setSelectedOptionIndex(optionIndex);
    setShowVotersModal(true);
  };

  const getVotersForOption = (optionIndex) => {
    const option = poll.options[optionIndex];
    if (!option || !option.voters) return [];
    
    return Object.values(option.voters)
      .filter(voter => voter && voter.voterName)
      .sort((a, b) => (a.votedAt || 0) - (b.votedAt || 0));
  };

  const getTimeRemaining = () => {
    if (!poll.isActive) return "Poll ended";
    
    const remaining = poll.expiresAt - Date.now();
    if (remaining <= 0) return "Expired";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getPercentage = (votes) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const canClosePoll = currentUserRoll === poll.createdBy && poll.isActive;

  return (
    <div className={`${
      isHistoryView 
        ? "bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600" 
        : "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-700 my-3"
    }`}>
      {/* Poll Header */}
      <div className={`flex items-start justify-between ${isHistoryView ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          <i className="fas fa-poll text-blue-600 dark:text-blue-400"></i>
          <span className={`${isHistoryView ? 'text-xs' : 'text-sm'} font-medium text-blue-600 dark:text-blue-400`}>
            Poll by {poll.createdByName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            poll.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {getTimeRemaining()}
          </span>
          {canClosePoll && poll.isActive && !isHistoryView && (
            <button
              onClick={() => setShowEditModal(true)}
              className="text-blue-500 hover:text-blue-700 text-xs"
              title="Edit Poll"
            >
              <i className="fas fa-edit"></i>
            </button>
          )}
          {canClosePoll && !isHistoryView && (
            <button
              onClick={() => onClosePoll(poll.id)}
              className="text-red-500 hover:text-red-700 text-xs"
              title="Close Poll"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
      </div>

      {/* Poll Question */}
      <h3 className={`${isHistoryView ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white ${isHistoryView ? 'mb-2' : 'mb-4'}`}>
        {poll.question}
      </h3>

      {/* Poll Options */}
      <div className={`${isHistoryView ? 'space-y-1 mb-2' : 'space-y-2 mb-4'}`}>
        {poll.options.map((option, index) => (
          <div key={index} className="relative">
            {showResults ? (
              // Results view
              <div className="relative">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 flex-1">
                    {userVotes.has(index) && (
                      <i className="fas fa-check-circle text-blue-600 dark:text-blue-400"></i>
                    )}
                    <div className="flex-1">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {option.text}
                      </span>
                      {/* Show voters if not anonymous */}
                      {!poll.isAnonymous && option.voters && Object.keys(option.voters).length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {Object.values(option.voters)
                              .filter(voter => voter && voter.voterName)
                              .slice(0, 3)
                              .map((voter, voterIndex) => (
                              <span
                                key={voterIndex}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                title={`${voter.voterName} (${voter.voterRoll})`}
                              >
                                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold mr-1">
                                  {voter.voterName.charAt(0)}
                                </div>
                                {voter.voterName}
                              </span>
                            ))}
                          </div>
                          {Object.keys(option.voters).length > 3 && (
                            <button
                              onClick={() => showVotersForOption(index)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              +{Object.keys(option.voters).length - 3} more voters
                            </button>
                          )}
                          {Object.keys(option.voters).length <= 3 && Object.keys(option.voters).length > 0 && (
                            <button
                              onClick={() => showVotersForOption(index)}
                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              View all voters
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {option.votes} vote{option.votes !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {getPercentage(option.votes)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-lg transition-all duration-500"
                     style={{ width: `${getPercentage(option.votes)}%` }}>
                </div>
              </div>
            ) : (
              // Voting view
              <button
                onClick={() => handleVote(index)}
                disabled={!poll.isActive || isVoting}
                className={`w-full p-3 text-left rounded-lg border transition-all ${
                  userVotes.has(index)
                    ? 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    poll.allowMultiple ? 'rounded' : 'rounded-full'
                  } ${
                    userVotes.has(index)
                      ? 'border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {userVotes.has(index) && (
                      <i className="fas fa-check text-white text-xs"></i>
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    {option.text}
                  </span>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Poll Footer */}
      <div className={`flex items-center justify-between ${isHistoryView ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
        <div className="flex items-center gap-4">
          <span>
            {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
          </span>
          {poll.allowMultiple && (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
              Multiple choice
            </span>
          )}
          {poll.isAnonymous ? (
            <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
              Anonymous
            </span>
          ) : (
            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
              <i className="fas fa-eye mr-1"></i>
              Public votes
            </span>
          )}
        </div>
        
        {userVotes.size > 0 && poll.isActive && (
          <button
            onClick={toggleResults}
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
          >
            {showResults ? 'Hide Results' : 'Show Results'}
          </button>
        )}
      </div>

      {/* Voters Modal */}
      {showVotersModal && selectedOptionIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Voters for "{poll.options[selectedOptionIndex].text}"
              </h3>
              <button
                onClick={() => setShowVotersModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {getVotersForOption(selectedOptionIndex).length > 0 ? (
                <div className="space-y-3">
                  {getVotersForOption(selectedOptionIndex).map((voter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {voter.voterName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {voter.voterName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Roll: {voter.voterRoll}
                        </div>
                        {voter.votedAt && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Voted {new Date(voter.votedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No voters yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <PollEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdatePoll={onEditPoll}
          poll={poll}
        />
      )}
    </div>
  );
};

export { PollCreationModal, PollEditModal, PollDisplay };
