import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

export class CodeSnippetHelper {
  constructor(obj = {}) {
    this.obj = obj;
  }

  async push(rollNumber) {
    try {
      const snippetId =
        this.obj?.id ||
        this.obj?.uid ||
        `snippet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const rollDocRef = doc(CodelibraryDB, COLLECTION, rollNumber);
      const snapshot = await getDoc(rollDocRef);
      const existingSnippets = snapshot.exists()
        ? this.normalizeSnippets(snapshot.data().snippets, rollNumber)
        : [];

      const snippet = {
        ...this.obj,
        id: snippetId,
        rollNumber,
        createdAt: this.obj.createdAt || new Date().toISOString(),
      };

      await setDoc(
        rollDocRef,
        {
          rollNumber,
          snippets: [...existingSnippets, snippet],
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      return {
        message: "Code snippet inserted successfully.",
      };
    } catch (error) {
      console.error("Error inserting data:", error);
      return { error: "Error inserting data" };
    }
  }

  async readById(snippetId) {
    try {
      const collectionRef = collection(CodelibraryDB, COLLECTION);
      const snapshots = await getDocs(collectionRef);

      for (const snapshot of snapshots.docs) {
        const data = snapshot.data();

        const snippets = this.normalizeSnippets(data.snippets, snapshot.id);
        const snippet = snippets.find((item) => item?.id === snippetId);

        if (snippet) {
          return {
            id: snippet.id,
            rollNumber: snapshot.id,
            ...snippet,
          };
        }

        if (snapshot.id === snippetId) {
          return {
            id: snapshot.id,
            rollNumber: data.rollNumber || snapshot.id,
            ...data,
          };
        }
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async readAllByRoll(rollNumber) {
    try {
      const rollDocRef = doc(CodelibraryDB, COLLECTION, rollNumber);
      const snapshot = await getDoc(rollDocRef);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.data();

      console.log("Loaded snippets:", data);

      return data.snippets;
    } catch (error) {
      throw error;
    }
  }

  async update(rollNumber, updatedDoc) {
    try {
      const rollDocRef = doc(CodelibraryDB, COLLECTION, String(rollNumber));
      const snapshot = await getDoc(rollDocRef);

      if (!snapshot.exists()) {
        throw new Error("Snippet document not found");
      }

      const snippets = snapshot.data().snippets;
      if (!Array.isArray(snippets)) {
        throw new Error("Invalid snippets data");
      }

      const snippetIndex = snippets.findIndex(
        (item) => item?.id === updatedDoc.id,
      );

      if (snippetIndex === -1) {
        throw new Error("Snippet not found");
      }

      snippets[snippetIndex] = {
        ...updatedDoc,
      };

      await setDoc(
        rollDocRef,
        {
          rollNumber: String(rollNumber),
          snippets: snippets,
        },
        { merge: true },
      );
    } catch (error) {
      throw error;
    }
  }

  async remove(snippetId) {
    try {
      const collectionRef = collection(CodelibraryDB, COLLECTION);
      const snapshots = await getDocs(collectionRef);

      for (const snapshot of snapshots.docs) {
        const data = snapshot.data();
        if (!Array.isArray(data.snippets)) {
          continue;
        }

        const nextSnippets = data.snippets.filter(
          (item) => item?.id !== snippetId,
        );

        if (nextSnippets.length === data.snippets.length) {
          continue;
        }

        if (nextSnippets.length === 0) {
          await deleteDoc(snapshot.ref);
        } else {
          await setDoc(
            snapshot.ref,
            {
              rollNumber: snapshot.id,
              snippets: nextSnippets,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }
        return;
      }

      throw new Error("Snippet not found");
    } catch (error) {
      throw error;
    }
  }
}
