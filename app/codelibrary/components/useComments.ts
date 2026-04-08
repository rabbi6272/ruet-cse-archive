"use client";
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";
import { users } from "@/db/students_info";
import { addNutrinos } from "@/lib/nutrinos-system";
import toast from "react-hot-toast";
import AuthUtils from "@/lib/auth-utils-secure";
import type { AuthUser, Comment, FirestoreSnippet, Reply } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getNameFromRoll(roll: string): string {
  const user = users.find((u) => u.roll === roll);
  if (!user) return "Unknown User";
  return user.name
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function generateId(): string {
  // Timestamp + random suffix — collision-safe for this use case
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Core Firestore write helper ──────────────────────────────────────────────
//
// All comment mutations follow the same pattern:
//   1. Read the roll document (one getDoc)
//   2. Find the target snippet by id
//   3. Apply a transform to its comments array
//   4. Write the whole snippets array back (one updateDoc)
//
// This replaces scattered RTDB ref/push/update/remove calls with a single,
// predictable read-modify-write function.

async function patchComments(
  rollNumber: string,
  snippetId: string,
  transform: (comments: Comment[]) => Comment[]
): Promise<void> {
  const rollRef = doc(CodelibraryDB, COLLECTION, rollNumber);
  const snap = await getDoc(rollRef);
  if (!snap.exists()) throw new Error(`Roll document ${rollNumber} not found`);

  const snippets: FirestoreSnippet[] = snap.data().snippets ?? [];

  const updatedSnippets = snippets.map((s) =>
    s.id === snippetId
      ? { ...s, comments: transform(s.comments ?? []) }
      : s
  );

  await updateDoc(rollRef, {
    snippets: updatedSnippets,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseCommentsOptions {
  snippetId: string;
  rollNumber: string;      // needed to locate the Firestore document
  snippetTitle: string;
  snippetAuthorRoll: string;
}

export function useComments({
  snippetId,
  rollNumber,
  snippetTitle,
  snippetAuthorRoll,
}: UseCommentsOptions) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Auth check ────────────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => {
      if (AuthUtils.isAuthenticated()) {
        const data = AuthUtils.getUserData();
        setUser(data ? { roll: data.roll, name: data.name } : null);
      } else {
        setUser(null);
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Real-time listener ────────────────────────────────────────────────────
  //
  // Subscribe to the roll document via onSnapshot. When any field changes
  // (including the embedded comments array), extract this snippet's comments
  // and update local state.

  useEffect(() => {
    if (!snippetId || !rollNumber) return;

    const rollRef = doc(CodelibraryDB, COLLECTION, rollNumber);

    const unsubscribe = onSnapshot(rollRef, (snap) => {
      if (!snap.exists()) {
        setComments([]);
        return;
      }
      const snippets: FirestoreSnippet[] = snap.data().snippets ?? [];
      const snippet = snippets.find((s) => s.id === snippetId);
      const raw = snippet?.comments ?? [];

      // Sort newest first for display
      const sorted = [...raw].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sorted);
    });

    return unsubscribe;
  }, [snippetId, rollNumber]);

  // ── Notifications (Firestore) ─────────────────────────────────────────────
  //
  // Replaces the RTDB push(ref(db, `notifications/${roll}`), ...) calls.
  // Notifications are stored as documents in a "notifications" collection.

  async function notify(
    recipientRoll: string,
    message: string,
    type: string,
    commentText?: string
  ): Promise<void> {
    if (!user || !recipientRoll || recipientRoll === user.roll) return;
    try {
      await addDoc(collection(CodelibraryDB, "notifications"), {
        recipientRoll,
        message,
        type,
        relatedSnippetId: snippetId,
        snippetTitle: snippetTitle ?? "Untitled Code",
        snippetAuthorRoll,
        commentText: commentText?.substring(0, 150) ?? null,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        read: false,
        fromUserRoll: user.roll,
        fromUserName: user.name ?? getNameFromRoll(user.roll),
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  async function notifyMentions(text: string): Promise<void> {
    if (!user) return;
    const regex = /@([^(]+)\((\d+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const mentionedRoll = match[2];
      if (mentionedRoll !== user.roll) {
        await notify(
          mentionedRoll,
          `${getNameFromRoll(user.roll)} mentioned you in ${getNameFromRoll(snippetAuthorRoll)}'s code`,
          "mention",
          text
        );
      }
    }
  }

  // ── CRUD helpers ──────────────────────────────────────────────────────────

  /** Wrap a patchComments call with loading state + toast feedback. */
  async function withLoading(
    fn: () => Promise<void>,
    successMsg?: string,
    errorMsg?: string
  ): Promise<boolean> {
    setLoading(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err) {
      console.error(err);
      if (errorMsg) toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  const addComment = (text: string): Promise<boolean> => {
    if (!user || !text.trim()) return Promise.resolve(false);
    const newComment: Comment = {
      id: generateId(),
      authorRoll: user.roll,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isEdited: false,
      likes: 0,
      likedBy: {},
      replies: [],
    };
    return withLoading(
      () => patchComments(rollNumber, snippetId, (prev) => [...prev, newComment]),
      "Comment added!",
      "Failed to add comment."
    );
  };

  const editComment = (commentId: string, text: string): Promise<boolean> => {
    if (!user || !text.trim()) return Promise.resolve(false);
    return withLoading(
      () =>
        patchComments(rollNumber, snippetId, (prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, text: text.trim(), isEdited: true, editedAt: new Date().toISOString() }
              : c
          )
        ),
      "Comment updated!",
      "Failed to update comment."
    );
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    if (!user || !confirm("Delete this comment?")) return;
    await withLoading(
      () =>
        patchComments(rollNumber, snippetId, (prev) =>
          prev.filter((c) => c.id !== commentId)
        ),
      "Comment deleted!",
      "Failed to delete comment."
    );
  };

  // ── Replies ───────────────────────────────────────────────────────────────

  const addReply = async (commentId: string, text: string): Promise<boolean> => {
    if (!user || !text.trim()) return false;

    const newReply: Reply = {
      id: generateId(),
      authorRoll: user.roll,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isEdited: false,
      likes: 0,
      likedBy: {},
    };

    const ok = await withLoading(
      () =>
        patchComments(rollNumber, snippetId, (prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies ?? []), newReply] }
              : c
          )
        )
    );

    if (ok) {
      const comment = comments.find((c) => c.id === commentId);
      // Notify comment author (if different user)
      if (comment && user.roll !== comment.authorRoll) {
        await notify(
          comment.authorRoll,
          `${getNameFromRoll(user.roll)} replied to your comment on ${getNameFromRoll(snippetAuthorRoll)}'s code`,
          "reply",
          text.trim()
        );
        await addNutrinos(
          comment.authorRoll,
          "reply_received",
          "Received Reply",
          { snippetId, commentId, replyText: text.trim(), replier: user.roll }
        ).catch(console.error);
      }
      // Notify mentions
      await notifyMentions(text.trim());
      // Replier earns Nutrinos
      await addNutrinos(user.roll, "reply_made", "Made Reply", {
        snippetId,
        commentId,
        replyText: text.trim(),
        originalCommenter: comment?.authorRoll,
      }).catch(console.error);
    }

    return ok;
  };

  const editReply = (
    commentId: string,
    replyId: string,
    text: string
  ): Promise<boolean> => {
    if (!user || !text.trim()) return Promise.resolve(false);
    return withLoading(() =>
      patchComments(rollNumber, snippetId, (prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === replyId
                    ? { ...r, text: text.trim(), isEdited: true, editedAt: new Date().toISOString() }
                    : r
                ),
              }
            : c
        )
      )
    );
  };

  const deleteReply = async (commentId: string, replyId: string): Promise<void> => {
    if (!user || !confirm("Delete this reply?")) return;
    await withLoading(
      () =>
        patchComments(rollNumber, snippetId, (prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
              : c
          )
        ),
      "Reply deleted!",
      "Failed to delete reply."
    );
  };

  // ── Likes (comments & replies) ────────────────────────────────────────────

  const toggleLike = async (
    commentId: string,
    isReply = false,
    parentCommentId?: string
  ): Promise<void> => {
    if (!user) return;

    // Read current liked state from local state (avoids extra Firestore read)
    const comment = comments.find((c) =>
      isReply ? c.id === parentCommentId : c.id === commentId
    );
    const item: Comment | Reply | undefined = isReply
      ? comment?.replies.find((r) => r.id === commentId)
      : comment;

    if (!item) return;

    const hasLiked = Boolean(item.likedBy?.[user.roll]);
    const newLikes = hasLiked
      ? Math.max(0, item.likes - 1)
      : item.likes + 1;
    const newLikedBy = { ...item.likedBy };
    if (hasLiked) delete newLikedBy[user.roll];
    else newLikedBy[user.roll] = true;

    await withLoading(() =>
      patchComments(rollNumber, snippetId, (prev) =>
        prev.map((c) => {
          if (!isReply && c.id === commentId) {
            return { ...c, likes: newLikes, likedBy: newLikedBy };
          }
          if (isReply && c.id === parentCommentId) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId
                  ? { ...r, likes: newLikes, likedBy: newLikedBy }
                  : r
              ),
            };
          }
          return c;
        })
      )
    );
  };

  return {
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
  };
}
