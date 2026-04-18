"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import AuthUtils from "@/lib/auth-utils-secure";
import { CommentsDB, COLLECTION as COMMENTS_COLLECTION } from "@/utils/CommentsDB";
import {
  createCommentActions,
  getNameFromRoll,
  normalizeComments,
  sortNewestFirst,
} from "./commentActions";
import type { AuthUser, Comment, UseCommentsOptions, UseCommentsReturn } from "./commentTypes";

export { getNameFromRoll };

export function useComments({
  snippetId,
  rollNumber,
  snippetTitle,
  snippetAuthorRoll,
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = () => {
      if (AuthUtils.isAuthenticated()) {
        const data = AuthUtils.getUserData() as AuthUser;
        setUser({ roll: data.roll, name: data.name });
      } else {
        setUser(null);
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!snippetId) {
      setComments([]);
      return;
    }

    const commentsRef = doc(CommentsDB, COMMENTS_COLLECTION, snippetId);

    const unsubscribe = onSnapshot(
      commentsRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setComments(sortNewestFirst(normalizeComments(data?.comments ?? [])));
          return;
        }

        setComments([]);
      },
      (error) => {
        console.error("[useComments] Firestore listener error:", error);
        setComments([]);
      },
    );

    return unsubscribe;
  }, [snippetId]);

  const actions = useMemo(
    () =>
      createCommentActions({
        snippetId,
        rollNumber,
        snippetTitle,
        snippetAuthorRoll,
        user,
        comments,
        setLoading,
      }),
    [comments, rollNumber, snippetAuthorRoll, snippetId, snippetTitle, user],
  );

  return {
    comments,
    user,
    loading,
    ...actions,
  };
}
