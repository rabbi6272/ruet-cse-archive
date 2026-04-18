"use client";

import { addDoc, collection, doc, runTransaction } from "firebase/firestore";
import type { Dispatch, SetStateAction } from "react";
import { CodelibraryDB } from "@/utils/CodelibraryDB";
import {
  CommentsDB,
  COLLECTION as COMMENTS_COLLECTION,
} from "@/utils/CommentsDB";
import { users } from "@/db/students_info";
import { addNutrinos } from "@/lib/nutrinos-system";
import toast from "react-hot-toast";
import type {
  AuthUser,
  Comment,
  CommentLikeMap,
  Reply,
  SnippetCommentInput,
} from "./commentTypes";

export function getNameFromRoll(roll: string): string {
  const user = users.find((candidate) => candidate.roll === roll);
  if (!user) return "Unknown User";
  return user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function normalizeLikedBy(likedBy: SnippetCommentInput["likedBy"]): CommentLikeMap {
  if (Array.isArray(likedBy)) {
    return likedBy.reduce<CommentLikeMap>((accumulator, roll) => {
      accumulator[roll] = true;
      return accumulator;
    }, {});
  }

  if (likedBy && typeof likedBy === "object") {
    return Object.entries(likedBy as Record<string, unknown>).reduce<CommentLikeMap>(
      (accumulator, [roll, isLiked]) => {
        if (isLiked) {
          accumulator[roll] = true;
        }
        return accumulator;
      },
      {},
    );
  }

  return {};
}

function normalizeReply(input: unknown, index: number): Reply {
  const reply = input as SnippetCommentInput;
  const createdAt = reply.createdAt
    ? new Date(reply.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: reply.id ?? reply.uid ?? reply.commentId ?? `reply_${index}`,
    authorRoll: reply.authorRoll ?? reply.commentAuthorRoll ?? "",
    text: reply.text ?? reply.comment ?? "",
    createdAt,
    editedAt: reply.editedAt,
    isEdited: reply.isEdited ?? Boolean(reply.editedAt),
    likes: reply.likes ?? 0,
    likedBy: normalizeLikedBy(reply.likedBy),
  };
}

export function normalizeComments(raw: unknown): Comment[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((input, index) => {
    const comment = input as SnippetCommentInput;
    const createdAt = comment.createdAt
      ? new Date(comment.createdAt).toISOString()
      : new Date().toISOString();

    return {
      id: comment.id ?? comment.uid ?? comment.commentId ?? `comment_${index}`,
      authorRoll: comment.authorRoll ?? comment.commentAuthorRoll ?? "",
      text: comment.text ?? comment.comment ?? "",
      createdAt,
      editedAt: comment.editedAt,
      isEdited: comment.isEdited ?? Boolean(comment.editedAt),
      likes: comment.likes ?? 0,
      likedBy: normalizeLikedBy(comment.likedBy),
      replies: Array.isArray(comment.replies)
        ? comment.replies.map((reply, replyIndex) => normalizeReply(reply, replyIndex))
        : [],
    };
  });
}

export function sortNewestFirst(comments: Comment[]): Comment[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function patchComments(
  snippetId: string,
  metadata: { rollNumber?: string; snippetTitle?: string; snippetAuthorRoll?: string },
  transform: (comments: Comment[]) => Comment[],
): Promise<void> {
  const commentsRef = doc(CommentsDB, COMMENTS_COLLECTION, snippetId);

  await runTransaction(CommentsDB, async (transaction) => {
    const snap = await transaction.get(commentsRef);
    const existing = snap.exists() ? snap.data() : {};
    const currentComments = normalizeComments(existing.comments ?? []);
    const nextComments = transform(currentComments);
    const now = new Date().toISOString();

    transaction.set(
      commentsRef,
      {
        snippetId,
        rollNumber: metadata.rollNumber ?? existing.rollNumber ?? null,
        snippetTitle: metadata.snippetTitle ?? existing.snippetTitle ?? null,
        snippetAuthorRoll:
          metadata.snippetAuthorRoll ?? existing.snippetAuthorRoll ?? null,
        comments: nextComments,
        createdAt: existing.createdAt ?? now,
        updatedAt: now,
      },
      { merge: true },
    );
  });
}

async function notify(
  user: AuthUser | null,
  recipientRoll: string,
  message: string,
  type: string,
  snippetId: string,
  snippetTitle: string,
  snippetAuthorRoll: string,
  commentText?: string,
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
  } catch (error) {
    console.error("Notification error:", error);
  }
}

async function notifyMentions(
  user: AuthUser | null,
  text: string,
  snippetId: string,
  snippetTitle: string,
  snippetAuthorRoll: string,
): Promise<void> {
  if (!user) return;

  const regex = /@([^(]+)\((\d+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const mentionedRoll = match[2];
    if (mentionedRoll !== user.roll) {
      await notify(
        user,
        mentionedRoll,
        `${getNameFromRoll(user.roll)} mentioned you in ${getNameFromRoll(snippetAuthorRoll)}'s code`,
        "mention",
        snippetId,
        snippetTitle,
        snippetAuthorRoll,
        text,
      );
    }
  }
}

async function withLoading(
  setLoading: Dispatch<SetStateAction<boolean>>,
  fn: () => Promise<void>,
  successMsg?: string,
  errorMsg?: string,
): Promise<boolean> {
  setLoading(true);
  try {
    await fn();
    if (successMsg) toast.success(successMsg);
    return true;
  } catch (error) {
    console.error(error);
    if (errorMsg) toast.error(errorMsg);
    return false;
  } finally {
    setLoading(false);
  }
}

export function createCommentActions({
  snippetId,
  rollNumber,
  snippetTitle,
  snippetAuthorRoll,
  user,
  comments,
  setLoading,
}: {
  snippetId: string;
  rollNumber: string;
  snippetTitle: string;
  snippetAuthorRoll: string;
  user: AuthUser | null;
  comments: Comment[];
  setLoading: Dispatch<SetStateAction<boolean>>;
}) {
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
      setLoading,
      () =>
        patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) => [
          ...prev,
          newComment,
        ]),
      "Comment added!",
      "Failed to add comment.",
    );
  };

  const editComment = (commentId: string, text: string): Promise<boolean> => {
    if (!user || !text.trim()) return Promise.resolve(false);

    return withLoading(
      setLoading,
      () =>
        patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  text: text.trim(),
                  isEdited: true,
                  editedAt: new Date().toISOString(),
                }
              : comment,
          ),
        ),
      "Comment updated!",
      "Failed to update comment.",
    );
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    if (!user || !confirm("Delete this comment?")) return;

    await withLoading(
      setLoading,
      () =>
        patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) =>
          prev.filter((comment) => comment.id !== commentId),
        ),
      "Comment deleted!",
      "Failed to delete comment.",
    );
  };

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

    const ok = await withLoading(setLoading, () =>
      patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment,
        ),
      ),
    );

    if (ok) {
      const comment = comments.find((item) => item.id === commentId);
      if (comment && user.roll !== comment.authorRoll) {
        await notify(
          user,
          comment.authorRoll,
          `${getNameFromRoll(user.roll)} replied to your comment on ${getNameFromRoll(snippetAuthorRoll)}'s code`,
          "reply",
          snippetId,
          snippetTitle,
          snippetAuthorRoll,
          text.trim(),
        );
        await addNutrinos(comment.authorRoll, "reply_received", "Received Reply", {
          snippetId,
          commentId,
          replyText: text.trim(),
          replier: user.roll,
        }).catch(console.error);
      }

      await notifyMentions(user, text.trim(), snippetId, snippetTitle, snippetAuthorRoll);
      await addNutrinos(user.roll, "reply_made", "Made Reply", {
        snippetId,
        commentId,
        replyText: text.trim(),
        originalCommenter: comment?.authorRoll,
      }).catch(console.error);
    }

    return ok;
  };

  const editReply = (commentId: string, replyId: string, text: string): Promise<boolean> => {
    if (!user || !text.trim()) return Promise.resolve(false);

    return withLoading(setLoading, () =>
      patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === replyId
                    ? {
                        ...reply,
                        text: text.trim(),
                        isEdited: true,
                        editedAt: new Date().toISOString(),
                      }
                    : reply,
                ),
              }
            : comment,
        ),
      ),
    );
  };

  const deleteReply = async (commentId: string, replyId: string): Promise<void> => {
    if (!user || !confirm("Delete this reply?")) return;

    await withLoading(
      setLoading,
      () =>
        patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: comment.replies.filter((reply) => reply.id !== replyId),
                }
              : comment,
          ),
        ),
      "Reply deleted!",
      "Failed to delete reply.",
    );
  };

  const toggleLike = async (
    commentId: string,
    isReply = false,
    parentCommentId?: string,
  ): Promise<void> => {
    if (!user) return;

    const comment = comments.find((item) =>
      isReply ? item.id === parentCommentId : item.id === commentId,
    );
    const item = isReply ? comment?.replies.find((reply) => reply.id === commentId) : comment;

    if (!item) return;

    const hasLiked = Boolean(item.likedBy?.[user.roll]);
    const newLikes = hasLiked ? Math.max(0, item.likes - 1) : item.likes + 1;
    const newLikedBy = { ...item.likedBy };
    if (hasLiked) delete newLikedBy[user.roll];
    else newLikedBy[user.roll] = true;

    await withLoading(setLoading, () =>
      patchComments(snippetId, { rollNumber, snippetTitle, snippetAuthorRoll }, (prev) =>
        prev.map((commentItem) => {
          if (!isReply && commentItem.id === commentId) {
            return { ...commentItem, likes: newLikes, likedBy: newLikedBy };
          }

          if (isReply && commentItem.id === parentCommentId) {
            return {
              ...commentItem,
              replies: commentItem.replies.map((reply) =>
                reply.id === commentId ? { ...reply, likes: newLikes, likedBy: newLikedBy } : reply,
              ),
            };
          }

          return commentItem;
        }),
      ),
    );
  };

  return {
    addComment,
    editComment,
    deleteComment,
    addReply,
    editReply,
    deleteReply,
    toggleLike,
  };
}
