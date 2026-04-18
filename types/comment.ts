export type Comment = {
  commentAuthorRoll: string;
  snippetAuthorRoll: string;
  commentId: string;
  snippetId: string;
  comment: string;
  likedBy: string[];
  replies: Comment[];
  createdAt: Date;
};
