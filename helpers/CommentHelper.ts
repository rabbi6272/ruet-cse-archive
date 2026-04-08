import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";
import { doc, getDoc, setDoc } from "firebase/firestore";

export class CommentHelper {
  obj: any;

  constructor(obj = {}) {
    this.obj = obj;
  }

  async push(roll: string, snippetId: string) {
    try {
      const docref = doc(CodelibraryDB, COLLECTION, String(roll));
      if (!docref) {
        console.error(`Document with roll ${roll} does not exist.`);
        return;
      }
      const snapshot = await getDoc(docref);
      if (!snapshot.exists()) {
        console.error(`Snapshot with roll ${roll} does not exist.`);
        return;
      }
      const data = snapshot.data();
      const commentToInsert = {
        ...this.obj,
        uid:
          this.obj?.uid ||
          this.obj?.id ||
          `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };

      data.snippets.map((item: any) => {
        if (
          item.snippetId === snippetId ||
          item.id === snippetId ||
          item.uid === snippetId
        ) {
          item.comments = [...(item.comments || []), commentToInsert];
        }
      });
      await setDoc(docref, data);
    } catch (error) {
      console.error("Error inserting comment:", error);
    }
  }

  async read(roll: string, snippetId: string) {
    try {
      const docref = doc(CodelibraryDB, COLLECTION, String(roll));
      const snapshot = await getDoc(docref);
      if (!snapshot.exists()) {
        console.error(`Snapshot with roll ${roll} does not exist.`);
        return [];
      }

      const data = snapshot.data();
      const snippet = data.snippets?.find(
        (item: any) => (item: any) =>
          item.snippetId === snippetId ||
          item.id === snippetId ||
          item.uid === snippetId,
      );

      if (!snippet || !Array.isArray(snippet.comments)) {
        return [];
      }

      return snippet.comments.map((comment: any, index: number) => {
        const normalizedUid =
          comment?.uid ||
          comment?.id ||
          `comment_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        return {
          ...comment,
          uid: normalizedUid,
          id: normalizedUid,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async update(commentId: string, updates: any) {
    try {
    } catch (error) {
      throw error;
    }
  }

  async remove(commentId: string) {
    try {
    } catch (error) {
      throw error;
    }
  }
}
