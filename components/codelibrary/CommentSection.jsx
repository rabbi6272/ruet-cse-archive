"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, push, onValue, off, update, query, orderByChild } from "firebase/database";
import { users } from "@/lib/mino";
import { formatDistanceToNow } from "date-fns";

function getNameFromRoll(roll) {
  const user = users.find((u) => u.roll === roll);
  if (!user) return "Unknown User";
  return user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const CommentSection = ({ snippetId, snippetAuthor, snippetTitle = "Untitled Code" }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState({});
  const commentInputRef = useRef(null);
  const replyInputRef = useRef(null);
  const maxRepliesPreview = 2;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch comments for this snippet
  useEffect(() => {
    const commentsRef = ref(db, `comments/${snippetId}`);
    const fetchComments = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentsArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
            replies: data[key].replies ? Object.keys(data[key].replies).map(replyKey => ({
              id: replyKey,
              ...data[key].replies[replyKey]
            })) : []
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setComments(commentsArray);
      } else {
        setComments([]);
      }
    });
    return () => off(commentsRef, "value", fetchComments);
  }, [snippetId]);

  // Handle mention detection and suggestions
  const handleInputChange = (value, isReply = false) => {
    if (isReply) {
      setReplyText(value);
    } else {
      setNewComment(value);
    }

    // Check for @ mentions
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.slice(1).toLowerCase();
      const suggestions = users
        .filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.roll.includes(query)
        )
        .slice(0, 5);
      setMentionSuggestions(suggestions);
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user, isReply = false) => {
    const currentText = isReply ? replyText : newComment;
    const words = currentText.split(' ');
    words[words.length - 1] = `@${user.name.replace(/\s+/g, '')}(${user.roll})`;
    const newText = words.join(' ') + ' ';
    
    if (isReply) {
      setReplyText(newText);
      replyInputRef.current?.focus();
    } else {
      setNewComment(newText);
      commentInputRef.current?.focus();
    }
    setShowMentions(false);
  };

  const addComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setLoading(true);
    try {
      const commentsRef = ref(db, `comments/${snippetId}`);
      await push(commentsRef, {
        text: newComment.trim(),
        authorRoll: user.roll,
        authorName: user.name,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: {}
      });

      // Create notification for snippet author if comment is not from author
      if (user.roll !== snippetAuthor) {
        await createNotification(
          snippetAuthor,
          `${getNameFromRoll(user.roll)} commented on your code`,
          'comment',
          snippetId,
          newComment.trim()
        );
      }

      // Check for mentions and create notifications
      const mentionRegex = /@([^(]+)\((\d+)\)/g;
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        const [, , mentionedRoll] = match;
        if (mentionedRoll !== user.roll) {
          await createNotification(
            mentionedRoll,
            `${getNameFromRoll(user.roll)} mentioned you in ${getNameFromRoll(snippetAuthor)}'s code`,
            'mention',
            snippetId,
            newComment.trim()
          );
        }
      }

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
    setLoading(false);
  };

  const addReply = async (commentId) => {
    if (!user || !replyText.trim()) return;
    
    setLoading(true);
    try {
      const repliesRef = ref(db, `comments/${snippetId}/${commentId}/replies`);
      await push(repliesRef, {
        text: replyText.trim(),
        authorRoll: user.roll,
        authorName: user.name,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: {}
      });

      // Find the comment author to notify
      const comment = comments.find(c => c.id === commentId);
      
      if (comment && user.roll !== comment.authorRoll) {
        await createNotification(
          comment.authorRoll,
          `${getNameFromRoll(user.roll)} replied to your comment on ${getNameFromRoll(snippetAuthor)}'s code`,
          'reply',
          snippetId,
          replyText.trim()
        );
      }

      // Check for mentions in reply
      const mentionRegex = /@([^(]+)\((\d+)\)/g;
      let match;
      while ((match = mentionRegex.exec(replyText)) !== null) {
        const [, , mentionedRoll] = match;
        if (mentionedRoll !== user.roll) {
          await createNotification(
            mentionedRoll,
            `${getNameFromRoll(user.roll)} mentioned you in ${getNameFromRoll(snippetAuthor)}'s code`,
            'mention',
            snippetId,
            replyText.trim()
          );
        }
      }

      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
    setLoading(false);
  };

  const createNotification = async (recipientRoll, message, type, relatedSnippetId, commentText = null) => {
    try {
      // Don't create notification for self
      if (recipientRoll === user.roll) {
        return;
      }
      
      // Validate recipient roll
      if (!recipientRoll) {
        console.error("No recipient roll provided");
        return;
      }
      
      const notificationRef = ref(db, `notifications/${recipientRoll}`);
      const notificationData = {
        message,
        type,
        relatedSnippetId,
        snippetTitle: snippetTitle || "Untitled Code",
        snippetAuthor,
        commentText: commentText ? commentText.substring(0, 150) : null,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        read: false,
        fromUserRoll: user.roll,
        fromUserName: user.name || getNameFromRoll(user.roll)
      };
      
      await push(notificationRef, notificationData);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const toggleCommentLike = async (commentId, isReply = false, parentCommentId = null) => {
    if (!user) return;
    
    const path = isReply 
      ? `comments/${snippetId}/${parentCommentId}/replies/${commentId}`
      : `comments/${snippetId}/${commentId}`;
    
    const itemRef = ref(db, path);
    
    try {
      const item = isReply 
        ? comments.find(c => c.id === parentCommentId)?.replies.find(r => r.id === commentId)
        : comments.find(c => c.id === commentId);
      
      if (!item) return;
      
      const hasLiked = item.likedBy && item.likedBy[user.roll];
      const newLikes = hasLiked ? (item.likes || 1) - 1 : (item.likes || 0) + 1;
      const newLikedBy = { ...item.likedBy };
      
      if (hasLiked) {
        delete newLikedBy[user.roll];
      } else {
        newLikedBy[user.roll] = true;
      }
      
      await update(itemRef, {
        likes: newLikes,
        likedBy: newLikedBy
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const renderText = (text) => {
    // Replace mentions with styled spans - updated regex to match the new mention format
    return text.replace(/@([^(]+)\((\d+)\)/g, '<span class="text-blue-500 font-medium">@$1</span>');
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "some time ago";
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Latest Comment Preview (Always show if exists) */}
      {comments.length > 0 && (
        <div className="mb-4">
          {/* Latest comment display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getNameFromRoll(comments[0].authorRoll).charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {getNameFromRoll(comments[0].authorRoll)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({comments[0].authorRoll})
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(comments[0].createdAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div 
              className="text-gray-800 dark:text-gray-200 text-sm mb-3 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderText(comments[0].text) }}
            />
            
            {/* Latest comment actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleCommentLike(comments[0].id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 text-sm ${
                    comments[0].likedBy && comments[0].likedBy[user?.roll]
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                  }`}
                >
                  <i
                    className={`${
                      comments[0].likedBy && comments[0].likedBy[user?.roll] ? "fas" : "far"
                    } fa-heart`}
                  ></i>
                  <span className="font-medium">{comments[0].likes || 0}</span>
                </button>
                
                {user && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comments[0].id ? null : comments[0].id)}
                    className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm"
                  >
                    <i className="fas fa-reply"></i>
                    <span className="font-medium">Reply</span>
                  </button>
                )}
              </div>
              
              {/* Show expand button if more comments exist */}
              {comments.length > 1 && (
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  {showAllComments 
                    ? "Hide other comments" 
                    : `View all ${comments.length} comments`
                  }
                </button>
              )}
            </div>
            
            {/* Show replies for latest comment */}
            {comments[0].replies && comments[0].replies.length > 0 && (
              <div className="mt-4 ml-4 space-y-3">
                <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                  {comments[0].replies
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    .slice(0, expandedReplies[comments[0].id] ? comments[0].replies.length : maxRepliesPreview)
                    .map((reply) => (
                      <div key={reply.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 shadow-sm border border-gray-100 dark:border-gray-600">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {getNameFromRoll(reply.authorRoll).charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {getNameFromRoll(reply.authorRoll)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                            
                            <div 
                              className="text-gray-800 dark:text-gray-200 text-xs mb-2 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: renderText(reply.text) }}
                            />
                            
                            <button
                              onClick={() => toggleCommentLike(reply.id, true, comments[0].id)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                reply.likedBy && reply.likedBy[user?.roll]
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                  : "bg-gray-100 dark:bg-gray-600 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                              }`}
                            >
                              <i
                                className={`${
                                  reply.likedBy && reply.likedBy[user?.roll] ? "fas" : "far"
                                } fa-heart`}
                              ></i>
                              <span className="font-medium">{reply.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                  {/* Show All Replies button for latest comment */}
                  {comments[0].replies.length > maxRepliesPreview && (
                    <div className="text-center">
                      <button
                        onClick={() => toggleExpandReplies(comments[0].id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                      >
                        {expandedReplies[comments[0].id] 
                          ? `Hide ${comments[0].replies.length - maxRepliesPreview} replies` 
                          : `Show all ${comments[0].replies.length} replies`
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Reply form for latest comment */}
            {replyingTo === comments[0].id && user && (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-blue-500">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                  <div className="flex space-x-3 p-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {getNameFromRoll(user.roll).charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <textarea
                        ref={replyInputRef}
                        value={replyText}
                        onChange={(e) => handleInputChange(e.target.value, true)}
                        placeholder="Write a reply... Use @username to mention someone"
                        className="w-full bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        rows="2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => addReply(comments[0].id)}
                      disabled={!replyText.trim() || loading}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {loading ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Comment Button/Section */}
      <div className="mb-4">
        {!showAddComment ? (
          <div className="flex items-center justify-between">
            {comments.length === 0 ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                <i className="far fa-comments mr-1"></i> No comments yet
              </span>
            ) : (
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
                {(() => {
                  const totalReplies = comments.reduce((sum, comment) => sum + (comment.replies ? comment.replies.length : 0), 0);
                  return totalReplies > 0 && <span>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</span>;
                })()}
              </div>
            )}
            
            {user && (
              <button
                onClick={() => setShowAddComment(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                <i className="fas fa-plus mr-2"></i>Add Comment
              </button>
            )}
          </div>
        ) : (
          /* Add comment form */
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
            <div className="flex space-x-3 p-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {getNameFromRoll(user.roll).charAt(0)}
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Share your thoughts... Use @username to mention someone"
                  className="w-full bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-lightbulb mr-1"></i>Tip: Use @username to mention
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddComment(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addComment}
                  disabled={!newComment.trim() || loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                >
                  {loading ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mention suggestions */}
      {showMentions && mentionSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl">
          {mentionSuggestions.map((suggestedUser) => (
            <button
              key={suggestedUser.roll}
              onClick={() => insertMention(suggestedUser, replyingTo ? true : false)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {getNameFromRoll(suggestedUser.roll).charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {getNameFromRoll(suggestedUser.roll)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {suggestedUser.roll}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* All Comments Section (when expanded) */}
      {showAllComments && comments.length > 1 && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold dark:text-gray-200 text-gray-800">
              Other Comments ({comments.length - 1})
            </h4>
            <button
              onClick={() => setShowAllComments(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Hide
            </button>
          </div>

          <div className="space-y-6">
            {comments.slice(1).map((comment) => (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
                {/* Comment header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {getNameFromRoll(comment.authorRoll).charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {getNameFromRoll(comment.authorRoll)}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>({comment.authorRoll})</span>
                        <span>•</span>
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment text */}
                <div 
                  className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderText(comment.text) }}
                />

                {/* Comment actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleCommentLike(comment.id)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-all duration-200 ${
                        comment.likedBy && comment.likedBy[user?.roll]
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                      }`}
                    >
                      <i
                        className={`${
                          comment.likedBy && comment.likedBy[user?.roll] ? "fas" : "far"
                        } fa-heart`}
                      ></i>
                      <span className="text-sm font-medium">{comment.likes || 0}</span>
                    </button>
                    
                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                      >
                        <i className="fas fa-reply"></i>
                        <span className="text-sm font-medium">Reply</span>
                      </button>
                    )}
                  </div>
                  
                  {comment.replies && comment.replies.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === comment.id && user && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-blue-500">
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                      <div className="flex space-x-3 p-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {getNameFromRoll(user.roll).charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <textarea
                            ref={replyInputRef}
                            value={replyText}
                            onChange={(e) => handleInputChange(e.target.value, true)}
                            placeholder="Write a reply... Use @username to mention someone"
                            className="w-full bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                            rows="2"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-4 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => addReply(comment.id)}
                          disabled={!replyText.trim() || loading}
                          className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        >
                          {loading ? "Posting..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-5 ml-4 space-y-3">
                    <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                      {comment.replies
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                        .slice(0, expandedReplies[comment.id] ? comment.replies.length : maxRepliesPreview)
                        .map((reply) => (
                          <div key={reply.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-600">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {getNameFromRoll(reply.authorRoll).charAt(0)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {getNameFromRoll(reply.authorRoll)}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({reply.authorRoll})
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                
                                <div 
                                  className="text-gray-800 dark:text-gray-200 text-sm mb-3 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: renderText(reply.text) }}
                                />
                                
                                <button
                                  onClick={() => toggleCommentLike(reply.id, true, comment.id)}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                    reply.likedBy && reply.likedBy[user?.roll]
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                      : "bg-gray-100 dark:bg-gray-600 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                  }`}
                                >
                                  <i
                                    className={`${
                                      reply.likedBy && reply.likedBy[user?.roll] ? "fas" : "far"
                                    } fa-heart`}
                                  ></i>
                                  <span className="font-medium">{reply.likes || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                      {/* Show All Replies button */}
                      {comment.replies.length > maxRepliesPreview && (
                        <div className="text-center">
                          <button
                            onClick={() => toggleExpandReplies(comment.id)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                          >
                            {expandedReplies[comment.id] 
                              ? `Hide ${comment.replies.length - maxRepliesPreview} replies` 
                              : `Show all ${comment.replies.length} replies`
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!user && !showAddComment && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl mb-2">
            <i className="fas fa-lock text-blue-600 dark:text-blue-400"></i>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Login to join the conversation
          </p>
          <a 
            href="/user/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium text-sm"
          >
            <i className="fas fa-rocket mr-2"></i>
            Login to Comment
          </a>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
