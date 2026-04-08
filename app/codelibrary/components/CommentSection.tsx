"use client";
import React, { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { users } from "@/db/students_info";
import { useComments, getNameFromRoll } from "./useComments";
import type { Snippet, Comment, Reply } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "some time ago";
  }
}

function renderText(text: string): string {
  return text.replace(
    /@([^(]+)\((\d+)\)/g,
    '<span class="text-blue-500 font-medium">@$1</span>',
  );
}

// ─── useMentionInput ──────────────────────────────────────────────────────────

interface SuggestionPosition {
  top: number;
  left: number;
}

function detectMention(value: string): string | null {
  const lastWord = value.split(" ").at(-1) ?? "";
  return lastWord.startsWith("@") && lastWord.length > 1
    ? lastWord.slice(1).toLowerCase()
    : null;
}

function useMentionInput() {
  const [suggestions, setSuggestions] = useState<typeof users>([]);
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<SuggestionPosition>({
    top: 0,
    left: 0,
  });
  const [activeInput, setActiveInput] = useState<"comment" | "reply" | null>(
    null,
  );

  function onTextChange(
    value: string,
    inputType: "comment" | "reply",
    inputRef: React.RefObject<HTMLTextAreaElement>,
  ) {
    setActiveInput(inputType);
    const q = detectMention(value);
    if (q !== null) {
      const found = users
        .filter((u) => u.name.toLowerCase().includes(q) || u.roll.includes(q))
        .slice(0, 5);
      setSuggestions(found);
      setVisible(found.length > 0);
      setSelectedIndex(0);

      if (inputRef.current) {
        const before = value.substring(0, inputRef.current.selectionStart);
        const lines = before.split("\n");
        setPosition({
          top: (lines.length - 1) * 20 + 40,
          left: lines[lines.length - 1].length * 8 + 20,
        });
      }
    } else {
      setVisible(false);
    }
  }

  function insertIntoText(currentText: string, u: (typeof users)[0]): string {
    const words = currentText.split(" ");
    words[words.length - 1] = `@${u.name.replace(/\s+/g, "")}(${u.roll})`;
    return words.join(" ") + " ";
  }

  function close() {
    setVisible(false);
    setActiveInput(null);
  }

  return {
    suggestions,
    visible,
    selectedIndex,
    setSelectedIndex,
    position,
    activeInput,
    onTextChange,
    insertIntoText,
    close,
  };
}

// ─── MentionDropdown ──────────────────────────────────────────────────────────

interface MentionDropdownProps {
  suggestions: typeof users;
  selectedIndex: number;
  position: SuggestionPosition;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  onSelect: (u: (typeof users)[0]) => void;
}

function MentionDropdown({
  suggestions,
  selectedIndex,
  position,
  colorFrom,
  colorTo,
  borderColor,
  onSelect,
}: MentionDropdownProps) {
  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-w-[320px]"
      style={{
        top: `${position.top}px`,
        left: `${Math.min(position.left, 200)}px`,
        transform: position.left > 200 ? "translateX(-100%)" : "none",
      }}
    >
      <div className="py-2">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Mention Suggestions
          </span>
        </div>
        {suggestions.map((u, i) => (
          <button
            key={u.roll}
            onClick={() => onSelect(u)}
            className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 flex items-center space-x-3 ${
              i === selectedIndex
                ? `bg-blue-100 dark:bg-blue-900/40 border-l-4 ${borderColor}`
                : ""
            }`}
          >
            <div
              className={`w-8 h-8 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm`}
            >
              {getNameFromRoll(u.roll).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                {getNameFromRoll(u.roll)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Roll: {u.roll}
              </div>
            </div>
            <i className="fas fa-at text-xs text-blue-500 dark:text-blue-400" />
          </button>
        ))}
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-keyboard mr-1" />
            Press Enter to select, Esc to dismiss
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ReplyItem ────────────────────────────────────────────────────────────────

interface ReplyItemProps {
  reply: Reply;
  comment: Comment;
  user: { roll: string } | null;
  loading: boolean;
  onToggleLike: (id: string, isReply: boolean, parentId: string) => void;
  onDelete: (commentId: string, replyId: string) => void;
  onEdit: (
    commentId: string,
    replyId: string,
    text: string,
  ) => Promise<boolean>;
}

function ReplyItem({
  reply,
  comment,
  user,
  loading,
  onToggleLike,
  onDelete,
  onEdit,
}: ReplyItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 shadow-sm border border-gray-100 dark:border-gray-600">
      <div className="flex items-start space-x-2">
        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {getNameFromRoll(reply.authorRoll).charAt(0)}
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

          {editing ? (
            <div className="mb-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={async () => {
                    const ok = await onEdit(comment.id, reply.id, editText);
                    if (ok) setEditing(false);
                  }}
                  disabled={loading}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  {loading ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditText(reply.text);
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
                dangerouslySetInnerHTML={{ __html: renderText(reply.text) }}
              />
              {reply.isEdited && (
                <span className="text-xs text-gray-500 italic mt-1 block">
                  (edited)
                </span>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleLike(reply.id, true, comment.id)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                reply.likedBy?.[user?.roll ?? ""]
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "bg-gray-100 dark:bg-gray-600 text-gray-500 hover:bg-red-50 hover:text-red-500"
              }`}
            >
              <i
                className={`${reply.likedBy?.[user?.roll ?? ""] ? "fas" : "far"} fa-heart`}
              />
              <span className="font-medium">{reply.likes || 0}</span>
            </button>

            {user?.roll === reply.authorRoll && (
              <>
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditText(reply.text);
                  }}
                  className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-200"
                >
                  <i className="fas fa-edit" />
                  <span className="font-medium">Edit</span>
                </button>
                <button
                  onClick={() => onDelete(comment.id, reply.id)}
                  className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                  <i className="fas fa-trash" />
                  <span className="font-medium">Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CommentSection ───────────────────────────────────────────────────────────

const MAX_REPLIES_PREVIEW = 2;

interface CommentSectionProps {
  snippet: Snippet;
}

const CommentSection = ({ snippet }: CommentSectionProps) => {
  const {
    comments,
    user,
    loading,
    addComment,
    editComment,
    deleteComment,
    addReply,
    editReply,
    deleteReply,
    toggleLike,
  } = useComments({
    snippetId: snippet.id,
    rollNumber: snippet.rollNumber, // ← new: locates the Firestore doc
    snippetTitle: snippet.title,
    snippetAuthorRoll: snippet.rollNumber,
  });

  // ── UI state ────────────────────────────────────────────────────────────────

  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Mention system ──────────────────────────────────────────────────────────

  const mention = useMentionInput();

  useEffect(() => {
    if (!mention.visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        mention.setSelectedIndex((p) =>
          p < mention.suggestions.length - 1 ? p + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        mention.setSelectedIndex((p) =>
          p > 0 ? p - 1 : mention.suggestions.length - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const u = mention.suggestions[mention.selectedIndex];
        if (u) handleInsertMention(u);
      } else if (e.key === "Escape") {
        mention.close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mention.visible, mention.suggestions, mention.selectedIndex]);

  function handleInsertMention(u: (typeof users)[0]) {
    if (mention.activeInput === "reply") {
      setReplyText((prev) => mention.insertIntoText(prev, u));
      replyInputRef.current?.focus();
    } else {
      setNewComment((prev) => mention.insertIntoText(prev, u));
      commentInputRef.current?.focus();
    }
    mention.close();
  }

  // ── Action handlers ─────────────────────────────────────────────────────────

  async function handleAddComment() {
    const ok = await addComment(newComment);
    if (ok) {
      setNewComment("");
      setShowAddComment(false);
    }
  }

  async function handleSaveCommentEdit(commentId: string) {
    const ok = await editComment(commentId, editCommentText);
    if (ok) {
      setEditingComment(null);
      setEditCommentText("");
    }
  }

  async function handleAddReply(commentId: string) {
    const ok = await addReply(commentId, replyText);
    if (ok) {
      setReplyText("");
      setReplyingTo(null);
    }
  }

  function toggleExpandReplies(commentId: string) {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }

  const totalReplies = comments.reduce(
    (sum, c) => sum + (c.replies?.length ?? 0),
    0,
  );

  // ─── Reply input box (reused in both preview and expanded section) ──────────

  function ReplyInput({ commentId }: { commentId: string }) {
    return (
      <div className="mt-4 ml-4 pl-4 border-l-2 border-blue-500 relative">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <div className="flex space-x-3 p-3">
            <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user && getNameFromRoll(user.roll).charAt(0)}
            </div>
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                mention.onTextChange(e.target.value, "reply", replyInputRef);
              }}
              placeholder="Write a reply… Use @username to mention"
              className="flex-1 bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500"
              rows={2}
            />
          </div>
          {mention.visible && mention.activeInput === "reply" && (
            <MentionDropdown
              suggestions={mention.suggestions}
              selectedIndex={mention.selectedIndex}
              position={mention.position}
              colorFrom="from-green-500"
              colorTo="to-teal-600"
              borderColor="border-green-500"
              onSelect={handleInsertMention}
            />
          )}
          <div className="flex justify-end space-x-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setReplyingTo(null)}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddReply(commentId)}
              disabled={!replyText.trim() || loading}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {loading ? "Posting…" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Replies list (reused in both sections) ─────────────────────────────────

  function RepliesList({ comment }: { comment: Comment }) {
    if (comment.replies.length === 0) return null;
    const sorted = [...comment.replies].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const visible = expandedReplies[comment.id]
      ? sorted
      : sorted.slice(0, MAX_REPLIES_PREVIEW);

    return (
      <div className="mt-4 ml-4 space-y-3">
        <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
          {visible.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              comment={comment}
              user={user}
              loading={loading}
              onToggleLike={toggleLike}
              onDelete={deleteReply}
              onEdit={editReply}
            />
          ))}
          {comment.replies.length > MAX_REPLIES_PREVIEW && (
            <div className="text-center">
              <button
                onClick={() => toggleExpandReplies(comment.id)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium transition-colors"
              >
                {expandedReplies[comment.id]
                  ? `Hide ${comment.replies.length - MAX_REPLIES_PREVIEW} replies`
                  : `Show all ${comment.replies.length} replies`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Comment body (text or edit form) ──────────────────────────────────────

  function CommentBody({
    comment,
    textSize = "sm",
  }: {
    comment: Comment;
    textSize?: string;
  }) {
    return editingComment === comment.id ? (
      <div className="mb-3">
        <textarea
          value={editCommentText}
          onChange={(e) => setEditCommentText(e.target.value)}
          className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-${textSize} resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
          rows={3}
        />
        <div className="flex items-center space-x-2 mt-2">
          <button
            onClick={() => handleSaveCommentEdit(comment.id)}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            {loading ? "Saving…" : "Save"}
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
          className={`text-gray-800 dark:text-gray-200 text-${textSize} leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: renderText(comment.text) }}
        />
        {comment.isEdited && (
          <span className="text-xs text-gray-500 italic mt-1 block">
            (edited)
          </span>
        )}
      </div>
    );
  }

  // ─── Comment action buttons ─────────────────────────────────────────────────

  function CommentActions({
    comment,
    size = "sm",
  }: {
    comment: Comment;
    size?: string;
  }) {
    const px = size === "sm" ? "px-2" : "px-3";
    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleLike(comment.id)}
          className={`flex items-center space-x-1 ${px} py-1 rounded-full transition-all duration-200 text-${size} ${
            comment.likedBy?.[user?.roll ?? ""]
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-50 hover:text-red-500"
          }`}
        >
          <i
            className={`${comment.likedBy?.[user?.roll ?? ""] ? "fas" : "far"} fa-heart`}
          />
          <span className="font-medium">{comment.likes || 0}</span>
        </button>

        {user && (
          <button
            onClick={() =>
              setReplyingTo(replyingTo === comment.id ? null : comment.id)
            }
            className={`flex items-center space-x-1 ${px} py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 text-${size}`}
          >
            <i className="fas fa-reply" />
            <span className="font-medium">Reply</span>
          </button>
        )}

        {user?.roll === comment.authorRoll && (
          <>
            <button
              onClick={() => {
                setEditingComment(comment.id);
                setEditCommentText(comment.text);
              }}
              className={`flex items-center space-x-1 ${px} py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-200 text-${size}`}
            >
              <i className="fas fa-edit" />
              <span className="font-medium">Edit</span>
            </button>
            <button
              onClick={() => deleteComment(comment.id)}
              className={`flex items-center space-x-1 ${px} py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-${size}`}
            >
              <i className="fas fa-trash" />
              <span className="font-medium">Delete</span>
            </button>
          </>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* ── Latest comment preview ─────────────────────────────────────────── */}
      {comments.length > 0 && (
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            {/* Author */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getNameFromRoll(comments[0].authorRoll).charAt(0)}
              </div>
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

            <CommentBody comment={comments[0]} />

            <div className="flex items-center justify-between">
              <CommentActions comment={comments[0]} />
              {comments.length > 1 && (
                <button
                  onClick={() => setShowAllComments((p) => !p)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium transition-colors"
                >
                  {showAllComments
                    ? "Hide other comments"
                    : `View all ${comments.length} comments`}
                </button>
              )}
            </div>

            {replyingTo === comments[0].id && user && (
              <ReplyInput commentId={comments[0].id} />
            )}
            <RepliesList comment={comments[0]} />
          </div>
        </div>
      )}

      {/* ── Add comment button / form ──────────────────────────────────────── */}
      <div className="mb-4">
        {!showAddComment ? (
          <div className="flex items-center justify-between">
            {comments.length === 0 ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                <i className="far fa-comments mr-1" /> No comments yet
              </span>
            ) : (
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {comments.length}{" "}
                  {comments.length === 1 ? "comment" : "comments"}
                </span>
                {totalReplies > 0 && (
                  <span>
                    {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
            )}
            {user && (
              <button
                onClick={() => setShowAddComment(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors font-medium"
              >
                <i className="fas fa-plus mr-2" />
                Add Comment
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all relative">
            <div className="flex space-x-3 p-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user && getNameFromRoll(user.roll).charAt(0)}
              </div>
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  mention.onTextChange(
                    e.target.value,
                    "comment",
                    commentInputRef,
                  );
                }}
                placeholder="Share your thoughts… Use @username to mention someone"
                className="flex-1 bg-transparent resize-none focus:outline-none dark:text-white text-gray-800 placeholder-gray-500"
                rows={3}
              />
            </div>
            {mention.visible && mention.activeInput === "comment" && (
              <MentionDropdown
                suggestions={mention.suggestions}
                selectedIndex={mention.selectedIndex}
                position={mention.position}
                colorFrom="from-blue-500"
                colorTo="to-purple-600"
                borderColor="border-blue-500"
                onSelect={handleInsertMention}
              />
            )}
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                <i className="fas fa-lightbulb mr-1" />
                Tip: Use @username to mention
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowAddComment(false);
                    setNewComment("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all"
                >
                  {loading ? "Posting…" : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── All comments (expanded) ────────────────────────────────────────── */}
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
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                {/* Author */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
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

                <CommentBody comment={comment} />

                <div className="flex items-center justify-between">
                  <CommentActions comment={comment} size="sm" />
                  {comment.replies.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>

                {replyingTo === comment.id && user && (
                  <ReplyInput commentId={comment.id} />
                )}
                <RepliesList comment={comment} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Login prompt ───────────────────────────────────────────────────── */}
      {!user && !showAddComment && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl mb-2">
            <i className="fas fa-lock text-blue-600 dark:text-blue-400" />
          </div>
          <a
            href="/user/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-medium text-sm"
          >
            <i className="fas fa-rocket mr-2" />
            Login to Comment
          </a>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
