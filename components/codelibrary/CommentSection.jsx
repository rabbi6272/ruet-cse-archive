"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  ref,
  push,
  onValue,
  off,
  update,
  remove,
  query,
  orderByChild,
} from "firebase/database";
import { users } from "@/lib/mino";
import { formatDistanceToNow } from "date-fns";
import { addNutrinos } from "@/lib/nutrinos-system";
import toast from "react-hot-toast";

function getNameFromRoll(roll) {
  const user = users.find((u) => u.roll === roll);
  if (!user) return "Unknown User";
  return user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const CommentSection = ({
  snippetId,
  snippetAuthor,
  snippetTitle = "Untitled Code",
}) => {
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
  const [activeMentionInput, setActiveMentionInput] = useState(null); // Track which input is active for mentions
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  }); // Track cursor position for suggestions
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0); // Track selected suggestion for keyboard navigation
  const [editingComment, setEditingComment] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editReplyText, setEditReplyText] = useState("");
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
            replies: data[key].replies
              ? Object.keys(data[key].replies).map((replyKey) => ({
                  id: replyKey,
                  ...data[key].replies[replyKey],
                }))
              : [],
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setComments(commentsArray);
      } else {
        setComments([]);
      }
    });
    return () => off(commentsRef, "value", fetchComments);
  }, [snippetId]);

  // Keyboard navigation for mention suggestions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showMentions || mentionSuggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selectedUser = mentionSuggestions[selectedSuggestionIndex];
        if (selectedUser) {
          insertMention(selectedUser, activeMentionInput === "reply");
        }
      } else if (e.key === "Escape") {
        setShowMentions(false);
        setActiveMentionInput(null);
      }
    };

    if (showMentions) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    showMentions,
    mentionSuggestions,
    selectedSuggestionIndex,
    activeMentionInput,
  ]);

  // Handle mention detection and suggestions
  const handleInputChange = (value, isReply = false) => {
    if (isReply) {
      setReplyText(value);
      setActiveMentionInput("reply");
    } else {
      setNewComment(value);
      setActiveMentionInput("comment");
    }

    // Check for @ mentions
    const words = value.split(" ");
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const query = lastWord.slice(1).toLowerCase();
      const suggestions = users
        .filter(
          (user) =>
            user.name.toLowerCase().includes(query) || user.roll.includes(query)
        )
        .slice(0, 5);
      setMentionSuggestions(suggestions);
      setMentionQuery(query);
      setShowMentions(true);
      setSelectedSuggestionIndex(0); // Reset selection index

      // Calculate cursor position for suggestion box
      const textareaRef = isReply ? replyInputRef : commentInputRef;
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lines = textBeforeCursor.split("\n");
        const currentLine = lines.length - 1;
        const currentColumn = lines[currentLine].length;

        // Calculate approximate position (this is a rough estimate)
        const lineHeight = 20; // Approximate line height
        const charWidth = 8; // Approximate character width
        setSuggestionPosition({
          top: currentLine * lineHeight + 40, // Add some offset
          left: currentColumn * charWidth + 20,
        });
      }
    } else {
      setShowMentions(false);
      setActiveMentionInput(null);
    }
  };

  const insertMention = (user, isReply = false) => {
    const currentText = isReply ? replyText : newComment;
    const words = currentText.split(" ");
    words[words.length - 1] = `@${user.name.replace(/\s+/g, "")}(${user.roll})`;
    const newText = words.join(" ") + " ";

    if (isReply) {
      setReplyText(newText);
      replyInputRef.current?.focus();
    } else {
      setNewComment(newText);
      commentInputRef.current?.focus();
    }
    setShowMentions(false);
    setActiveMentionInput(null);
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
        likedBy: {},
      });

      // Create notification for snippet author if comment is not from author
      if (user.roll !== snippetAuthor) {
        await createNotification(
          snippetAuthor,
          `${getNameFromRoll(user.roll)} commented on your code`,
          "comment",
          snippetId,
          newComment.trim()
        );
      }

      // Award Nutrinos points for comments
      try {
        // Commenter gets 2.5 points
        await addNutrinos(user.roll, "comment_made", "Made Comment", {
          snippetId,
          commentText: newComment.trim(),
          snippetAuthor,
        });

        // Snippet author gets 1.5 points (only if commenter is different)
        if (user.roll !== snippetAuthor) {
          await addNutrinos(
            snippetAuthor,
            "comment_received",
            "Received Comment",
            {
              snippetId,
              commentText: newComment.trim(),
              commenter: user.roll,
            }
          );
        }
      } catch (nutritosError) {
        console.error(
          "Failed to award Nutrinos points for comment:",
          nutritosError
        );
        // Don't break the flow, just log the error
      }

      // Check for mentions and create notifications
      const mentionRegex = /@([^(]+)\((\d+)\)/g;
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        const [, , mentionedRoll] = match;
        if (mentionedRoll !== user.roll) {
          await createNotification(
            mentionedRoll,
            `${getNameFromRoll(user.roll)} mentioned you in ${getNameFromRoll(
              snippetAuthor
            )}'s code`,
            "mention",
            snippetId,
            newComment.trim()
          );

          // Award Nutrinos points for mention
          try {
            await addNutrinos(
              mentionedRoll,
              "mention_received",
              "Got Mentioned",
              {
                snippetId,
                commentText: newComment.trim(),
                mentioner: user.roll,
              }
            );
          } catch (nutritosError) {
            console.error(
              "Failed to award Nutrinos points for mention:",
              nutritosError
            );
          }
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
        likedBy: {},
      });

      // Find the comment author to notify
      const comment = comments.find((c) => c.id === commentId);

      if (comment && user.roll !== comment.authorRoll) {
        await createNotification(
          comment.authorRoll,
          `${getNameFromRoll(
            user.roll
          )} replied to your comment on ${getNameFromRoll(
            snippetAuthor
          )}'s code`,
          "reply",
          snippetId,
          replyText.trim()
        );
      }

      // Award Nutrinos points for replies
      try {
        // Replier gets 1.5 points
        await addNutrinos(user.roll, "reply_made", "Made Reply", {
          snippetId,
          commentId,
          replyText: replyText.trim(),
          originalCommenter: comment?.authorRoll,
        });

        // Original commenter gets 0.25 points (only if replier is different)
        if (comment && user.roll !== comment.authorRoll) {
          await addNutrinos(
            comment.authorRoll,
            "reply_received",
            "Received Reply",
            {
              snippetId,
              commentId,
              replyText: replyText.trim(),
              replier: user.roll,
            }
          );
        }
      } catch (nutritosError) {
        console.error(
          "Failed to award Nutrinos points for reply:",
          nutritosError
        );
        // Don't break the flow, just log the error
      }

      // Check for mentions in reply
      const mentionRegex = /@([^(]+)\((\d+)\)/g;
      let match;
      while ((match = mentionRegex.exec(replyText)) !== null) {
        const [, , mentionedRoll] = match;
        if (mentionedRoll !== user.roll) {
          await createNotification(
            mentionedRoll,
            `${getNameFromRoll(user.roll)} mentioned you in ${getNameFromRoll(
              snippetAuthor
            )}'s code`,
            "mention",
            snippetId,
            replyText.trim()
          );

          // Award Nutrinos points for mention in reply
          try {
            await addNutrinos(
              mentionedRoll,
              "mention_received",
              "Got Mentioned in Reply",
              {
                snippetId,
                commentId,
                replyText: replyText.trim(),
                mentioner: user.roll,
              }
            );
          } catch (nutritosError) {
            console.error(
              "Failed to award Nutrinos points for mention in reply:",
              nutritosError
            );
          }
        }
      }

      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
    setLoading(false);
  };

  // Edit comment function
  const editComment = async (commentId) => {
    if (!user || !editCommentText.trim()) return;

    setLoading(true);
    try {
      const commentRef = ref(db, `comments/${snippetId}/${commentId}`);
      await update(commentRef, {
        text: editCommentText.trim(),
        editedAt: new Date().toISOString(),
        isEdited: true,
      });

      // Award Nutrinos points for comment edit
      try {
        await addNutrinos(user.roll, "comment_edit", "Edited Comment", {
          snippetId,
          commentId,
          editedText: editCommentText.trim(),
        });
      } catch (nutritosError) {
        console.error(
          "Failed to award Nutrinos points for comment edit:",
          nutritosError
        );
      }

      setEditingComment(null);
      setEditCommentText("");
      toast.success("Comment updated successfully!");
    } catch (error) {
      console.error("Error editing comment:", error);
      toast.error("Failed to update comment. Please try again.");
    }
    setLoading(false);
  };

  // Delete comment function
  const deleteComment = async (commentId) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    setLoading(true);
    try {
      const commentRef = ref(db, `comments/${snippetId}/${commentId}`);
      await remove(commentRef); // Properly remove the comment

      // Deduct Nutrinos points for comment deletion
      try {
        await addNutrinos(user.roll, "comment_delete", "Comment Deleted", {
          snippetId,
          commentId,
        });
      } catch (nutritosError) {
        console.error(
          "Failed to deduct Nutrinos points for comment deletion:",
          nutritosError
        );
      }

      toast.success("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment. Please try again.");
    }
    setLoading(false);
  };

  // Edit reply function
  const editReply = async (commentId, replyId) => {
    if (!user || !editReplyText.trim()) return;

    setLoading(true);
    try {
      const replyRef = ref(
        db,
        `comments/${snippetId}/${commentId}/replies/${replyId}`
      );
      await update(replyRef, {
        text: editReplyText.trim(),
        editedAt: new Date().toISOString(),
        isEdited: true,
      });

      // Award Nutrinos points for reply edit
      try {
        await addNutrinos(user.roll, "reply_edit", "Edited Reply", {
          snippetId,
          commentId,
          replyId,
          editedText: editReplyText.trim(),
        });
      } catch (nutritosError) {
        console.error(
          "Failed to award Nutrinos points for reply edit:",
          nutritosError
        );
      }

      setEditingReply(null);
      setEditReplyText("");
      toast.success("Reply updated successfully!");
    } catch (error) {
      console.error("Error editing reply:", error);
      toast.error("Failed to update reply. Please try again.");
    }
    setLoading(false);
  };

  // Delete reply function
  const deleteReply = async (commentId, replyId) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this reply?")) return;

    setLoading(true);
    try {
      const replyRef = ref(
        db,
        `comments/${snippetId}/${commentId}/replies/${replyId}`
      );
      await remove(replyRef); // Properly remove the reply

      // Deduct Nutrinos points for reply deletion
      try {
        await addNutrinos(user.roll, "reply_delete", "Reply Deleted", {
          snippetId,
          commentId,
          replyId,
        });
      } catch (nutritosError) {
        console.error(
          "Failed to deduct Nutrinos points for reply deletion:",
          nutritosError
        );
      }

      toast.success("Reply deleted successfully!");
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply. Please try again.");
    }
    setLoading(false);
  };

  const createNotification = async (
    recipientRoll,
    message,
    type,
    relatedSnippetId,
    commentText = null
  ) => {
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
        fromUserName: user.name || getNameFromRoll(user.roll),
      };

      await push(notificationRef, notificationData);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const toggleCommentLike = async (
    commentId,
    isReply = false,
    parentCommentId = null
  ) => {
    if (!user) return;

    const path = isReply
      ? `comments/${snippetId}/${parentCommentId}/replies/${commentId}`
      : `comments/${snippetId}/${commentId}`;

    const itemRef = ref(db, path);

    try {
      const item = isReply
        ? comments
            .find((c) => c.id === parentCommentId)
            ?.replies.find((r) => r.id === commentId)
        : comments.find((c) => c.id === commentId);

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
        likedBy: newLikedBy,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const renderText = (text) => {
    // Replace mentions with styled spans - updated regex to match the new mention format
    return text.replace(
      /@([^(]+)\((\d+)\)/g,
      '<span className="text-blue-500 font-medium">@$1</span>'
    );
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
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

            {/* Latest comment text or edit form */}
            {editingComment === comments[0].id ? (
              <div className="mb-3">
                <textarea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => editComment(comments[0].id)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditCommentText("");
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <div
                  className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderText(comments[0].text),
                  }}
                />
                {comments[0].isEdited && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 block">
                    (edited)
                  </span>
                )}
              </div>
            )}

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
                      comments[0].likedBy && comments[0].likedBy[user?.roll]
                        ? "fas"
                        : "far"
                    } fa-heart`}
                  ></i>
                  <span className="font-medium">{comments[0].likes || 0}</span>
                </button>

                {user && (
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comments[0].id ? null : comments[0].id
                      )
                    }
                    className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-sm"
                  >
                    <i className="fas fa-reply"></i>
                    <span className="font-medium">Reply</span>
                  </button>
                )}

                {/* Edit and Delete buttons for latest comment author */}
                {user && user.roll === comments[0].authorRoll && (
                  <>
                    <button
                      onClick={() => {
                        setEditingComment(comments[0].id);
                        setEditCommentText(comments[0].text);
                      }}
                      className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-200 text-sm"
                    >
                      <i className="fas fa-edit"></i>
                      <span className="font-medium">Edit</span>
                    </button>

                    <button
                      onClick={() => deleteComment(comments[0].id)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 text-sm"
                    >
                      <i className="fas fa-trash"></i>
                      <span className="font-medium">Delete</span>
                    </button>
                  </>
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
                    : `View all ${comments.length} comments`}
                </button>
              )}
            </div>

            {/* Show replies for latest comment */}
            {comments[0].replies && comments[0].replies.length > 0 && (
              <div className="mt-4 ml-4 space-y-3">
                <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                  {comments[0].replies
                    .sort(
                      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                    )
                    .slice(
                      0,
                      expandedReplies[comments[0].id]
                        ? comments[0].replies.length
                        : maxRepliesPreview
                    )
                    .map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 shadow-sm border border-gray-100 dark:border-gray-600"
                      >
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

                            {/* Reply text or edit form (preview section) */}
                            {editingReply === reply.id ? (
                              <div className="mb-2">
                                <textarea
                                  value={editReplyText}
                                  onChange={(e) =>
                                    setEditReplyText(e.target.value)
                                  }
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows="2"
                                />
                                <div className="flex items-center space-x-2 mt-2">
                                  <button
                                    onClick={() =>
                                      editReply(comments[0].id, reply.id)
                                    }
                                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                    disabled={loading}
                                  >
                                    {loading ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingReply(null);
                                      setEditReplyText("");
                                    }}
                                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-2">
                                <div
                                  className="text-gray-800 dark:text-gray-200 text-xs leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: renderText(reply.text),
                                  }}
                                />
                                {reply.isEdited && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 block">
                                    (edited)
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  toggleCommentLike(
                                    reply.id,
                                    true,
                                    comments[0].id
                                  )
                                }
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                  reply.likedBy && reply.likedBy[user?.roll]
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                    : "bg-gray-100 dark:bg-gray-600 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                }`}
                              >
                                <i
                                  className={`${
                                    reply.likedBy && reply.likedBy[user?.roll]
                                      ? "fas"
                                      : "far"
                                  } fa-heart`}
                                ></i>
                                <span className="font-medium">
                                  {reply.likes || 0}
                                </span>
                              </button>

                              {/* Edit and Delete buttons for reply author (preview section) */}
                              {user && user.roll === reply.authorRoll && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingReply(reply.id);
                                      setEditReplyText(reply.text);
                                    }}
                                    className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-200"
                                  >
                                    <i className="fas fa-edit"></i>
                                    <span className="font-medium">Edit</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteReply(comments[0].id, reply.id)
                                    }
                                    className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                  >
                                    <i className="fas fa-trash"></i>
                                    <span className="font-medium">Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
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
                          ? `Hide ${
                              comments[0].replies.length - maxRepliesPreview
                            } replies`
                          : `Show all ${comments[0].replies.length} replies`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reply form for latest comment */}
            {replyingTo === comments[0].id && user && (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-blue-500 relative">
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
                        onChange={(e) =>
                          handleInputChange(e.target.value, true)
                        }
                        placeholder="Write a reply... Use @username to mention someone"
                        className="w-full bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        rows="2"
                      />
                    </div>
                  </div>

                  {/* Mention suggestions for reply */}
                  {showMentions &&
                    activeMentionInput === "reply" &&
                    mentionSuggestions.length > 0 && (
                      <div
                        className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-w-[320px]"
                        style={{
                          top: `${suggestionPosition.top}px`,
                          left: `${Math.min(suggestionPosition.left, 200)}px`, // Prevent overflow
                          transform:
                            suggestionPosition.left > 200
                              ? "translateX(-100%)"
                              : "none",
                        }}
                      >
                        <div className="py-2">
                          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Mention Suggestions
                            </span>
                          </div>
                          {mentionSuggestions.map((suggestedUser, index) => (
                            <button
                              key={suggestedUser.roll}
                              onClick={() => insertMention(suggestedUser, true)}
                              className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 flex items-center space-x-3 ${
                                index === 0
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : ""
                              }`}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                {getNameFromRoll(suggestedUser.roll).charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                  {getNameFromRoll(suggestedUser.roll)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Roll: {suggestedUser.roll}
                                </div>
                              </div>
                              <div className="text-purple-500 dark:text-purple-400">
                                <i className="fas fa-at text-xs"></i>
                              </div>
                            </button>
                          ))}
                          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              <i className="fas fa-keyboard mr-1"></i>
                              Press Enter to select, Esc to dismiss
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

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
                <span>
                  {comments.length}{" "}
                  {comments.length === 1 ? "comment" : "comments"}
                </span>
                {(() => {
                  const totalReplies = comments.reduce(
                    (sum, comment) =>
                      sum + (comment.replies ? comment.replies.length : 0),
                    0
                  );
                  return (
                    totalReplies > 0 && (
                      <span>
                        {totalReplies}{" "}
                        {totalReplies === 1 ? "reply" : "replies"}
                      </span>
                    )
                  );
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200 relative">
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

            {/* Mention suggestions for main comment */}
            {showMentions &&
              activeMentionInput === "comment" &&
              mentionSuggestions.length > 0 && (
                <div
                  className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-w-[320px]"
                  style={{
                    top: `${suggestionPosition.top}px`,
                    left: `${Math.min(suggestionPosition.left, 200)}px`, // Prevent overflow
                    transform:
                      suggestionPosition.left > 200
                        ? "translateX(-100%)"
                        : "none",
                  }}
                >
                  <div className="py-2">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Mention Suggestions
                      </span>
                    </div>
                    {mentionSuggestions.map((suggestedUser, index) => (
                      <button
                        key={suggestedUser.roll}
                        onClick={() => insertMention(suggestedUser, false)}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 flex items-center space-x-3 ${
                          index === selectedSuggestionIndex
                            ? "bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500"
                            : ""
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {getNameFromRoll(suggestedUser.roll).charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {getNameFromRoll(suggestedUser.roll)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Roll: {suggestedUser.roll}
                          </div>
                        </div>
                        <div className="text-blue-500 dark:text-blue-400">
                          <i className="fas fa-at text-xs"></i>
                        </div>
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <i className="fas fa-keyboard mr-1"></i>
                        Press Enter to select, Esc to dismiss
                      </span>
                    </div>
                  </div>
                </div>
              )}

            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-lightbulb mr-1"></i>Tip: Use @username to
                  mention
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
              <div
                key={comment.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
              >
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

                {/* Comment text or edit form */}
                {editingComment === comment.id ? (
                  <div className="mb-4">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => editComment(comment.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditCommentText("");
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div
                      className="text-gray-800 dark:text-gray-200 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: renderText(comment.text),
                      }}
                    />
                    {comment.isEdited && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 block">
                        (edited)
                      </span>
                    )}
                  </div>
                )}

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
                          comment.likedBy && comment.likedBy[user?.roll]
                            ? "fas"
                            : "far"
                        } fa-heart`}
                      ></i>
                      <span className="text-sm font-medium">
                        {comment.likes || 0}
                      </span>
                    </button>

                    {user && (
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                      >
                        <i className="fas fa-reply"></i>
                        <span className="text-sm font-medium">Reply</span>
                      </button>
                    )}

                    {/* Edit and Delete buttons for comment author */}
                    {user && user.roll === comment.authorRoll && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditCommentText(comment.text);
                          }}
                          className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-200"
                        >
                          <i className="fas fa-edit"></i>
                          <span className="text-sm font-medium">Edit</span>
                        </button>

                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                        >
                          <i className="fas fa-trash"></i>
                          <span className="text-sm font-medium">Delete</span>
                        </button>
                      </>
                    )}
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === comment.id && user && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-blue-500 relative">
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
                            onChange={(e) =>
                              handleInputChange(e.target.value, true)
                            }
                            placeholder="Write a reply... Use @username to mention someone"
                            className="w-full bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                            rows="2"
                          />
                        </div>
                      </div>

                      {/* Mention suggestions for expanded comment replies */}
                      {showMentions &&
                        activeMentionInput === "reply" &&
                        mentionSuggestions.length > 0 && (
                          <div
                            className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-w-[320px]"
                            style={{
                              top: `${suggestionPosition.top}px`,
                              left: `${Math.min(
                                suggestionPosition.left,
                                200
                              )}px`, // Prevent overflow
                              transform:
                                suggestionPosition.left > 200
                                  ? "translateX(-100%)"
                                  : "none",
                            }}
                          >
                            <div className="py-2">
                              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  Mention Suggestions
                                </span>
                              </div>
                              {mentionSuggestions.map(
                                (suggestedUser, index) => (
                                  <button
                                    key={suggestedUser.roll}
                                    onClick={() =>
                                      insertMention(suggestedUser, true)
                                    }
                                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 flex items-center space-x-3 ${
                                      index === selectedSuggestionIndex
                                        ? "bg-blue-100 dark:bg-blue-900/40 border-l-4 border-green-500"
                                        : ""
                                    }`}
                                  >
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                      {getNameFromRoll(
                                        suggestedUser.roll
                                      ).charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                        {getNameFromRoll(suggestedUser.roll)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Roll: {suggestedUser.roll}
                                      </div>
                                    </div>
                                    <div className="text-green-500 dark:text-green-400">
                                      <i className="fas fa-at text-xs"></i>
                                    </div>
                                  </button>
                                )
                              )}
                              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <i className="fas fa-keyboard mr-1"></i>
                                  Press Enter to select, Esc to dismiss
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

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
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt) - new Date(b.createdAt)
                        )
                        .slice(
                          0,
                          expandedReplies[comment.id]
                            ? comment.replies.length
                            : maxRepliesPreview
                        )
                        .map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-600"
                          >
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
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    •
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                </div>

                                {/* Reply text or edit form */}
                                {editingReply === reply.id ? (
                                  <div className="mb-3">
                                    <textarea
                                      value={editReplyText}
                                      onChange={(e) =>
                                        setEditReplyText(e.target.value)
                                      }
                                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      rows="2"
                                    />
                                    <div className="flex items-center space-x-2 mt-2">
                                      <button
                                        onClick={() =>
                                          editReply(comment.id, reply.id)
                                        }
                                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                                        disabled={loading}
                                      >
                                        {loading ? "Saving..." : "Save"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingReply(null);
                                          setEditReplyText("");
                                        }}
                                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-3">
                                    <div
                                      className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed"
                                      dangerouslySetInnerHTML={{
                                        __html: renderText(reply.text),
                                      }}
                                    />
                                    {reply.isEdited && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 block">
                                        (edited)
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      toggleCommentLike(
                                        reply.id,
                                        true,
                                        comment.id
                                      )
                                    }
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                      reply.likedBy && reply.likedBy[user?.roll]
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : "bg-gray-100 dark:bg-gray-600 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                    }`}
                                  >
                                    <i
                                      className={`${
                                        reply.likedBy &&
                                        reply.likedBy[user?.roll]
                                          ? "fas"
                                          : "far"
                                      } fa-heart`}
                                    ></i>
                                    <span className="font-medium">
                                      {reply.likes || 0}
                                    </span>
                                  </button>

                                  {/* Edit and Delete buttons for reply author */}
                                  {user && user.roll === reply.authorRoll && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingReply(reply.id);
                                          setEditReplyText(reply.text);
                                        }}
                                        className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-200"
                                      >
                                        <i className="fas fa-edit"></i>
                                        <span className="font-medium">
                                          Edit
                                        </span>
                                      </button>

                                      <button
                                        onClick={() =>
                                          deleteReply(comment.id, reply.id)
                                        }
                                        className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                      >
                                        <i className="fas fa-trash"></i>
                                        <span className="font-medium">
                                          Delete
                                        </span>
                                      </button>
                                    </>
                                  )}
                                </div>
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
                              ? `Hide ${
                                  comment.replies.length - maxRepliesPreview
                                } replies`
                              : `Show all ${comment.replies.length} replies`}
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
