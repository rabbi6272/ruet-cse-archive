import type { Comment as CanonicalComment } from "../../../types/comment";

export type AuthUser = {
  roll: string;
  name: string;
};

export type CommentLikeMap = Record<string, boolean>;

export type Reply = {
  id: string;
  authorRoll: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  isEdited: boolean;
  likes: number;
  likedBy: CommentLikeMap;
};

export type Comment = Reply & {
  replies: Reply[];
};

export type SnippetCommentInput = Partial<CanonicalComment> & {
  id?: string;
  uid?: string;
  authorRoll?: string;
  text?: string;
  createdAt?: string | Date;
  editedAt?: string;
  isEdited?: boolean;
  likes?: number;
  likedBy?: CommentLikeMap | string[];
  replies?: unknown[];
};

export type UseCommentsOptions = {
  snippetId: string;
  rollNumber: string;
  snippetTitle: string;
  snippetAuthorRoll: string;
};

export type UseCommentsReturn = {
  comments: Comment[];
  user: AuthUser | null;
  loading: boolean;
  addComment: (text: string) => Promise<boolean>;
  editComment: (commentId: string, text: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<void>;
  addReply: (commentId: string, text: string) => Promise<boolean>;
  editReply: (commentId: string, replyId: string, text: string) => Promise<boolean>;
  deleteReply: (commentId: string, replyId: string) => Promise<void>;
  toggleLike: (commentId: string, isReply?: boolean, parentCommentId?: string) => Promise<void>;
};
