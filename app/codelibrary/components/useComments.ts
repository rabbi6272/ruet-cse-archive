"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
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

    // Auth in this app is localStorage-based. React to changes via the
    // `storage` event (fires when localStorage is written, incl. login/logout)
    // and on tab focus (covers drift between sessions). No polling needed.
    const onStorage = (event: StorageEvent) => {
      if (event.key === "user") check();
    };
    const onFocus = () => check();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!snippetId) {
      setComments([]);
      return;
    }

    const commentsRef = ref(CommentsDB, `${COMMENTS_COLLECTION}/${snippetId}`);

    const unsubscribe = onValue(
      commentsRef,
      (snap) => {
        const data = snap.val() as { comments?: unknown } | null;
        setComments(sortNewestFirst(normalizeComments(data?.comments ?? [])));
      },
      (error) => {
        console.error("[useComments] Database listener error:", error);
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
