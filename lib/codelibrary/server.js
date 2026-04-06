import { collection, getDocs } from "firebase/firestore";
import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";

// Server-side data fetching utilities for code library

function flattenSnippetDocuments(snapshots) {
  const snippets = [];

  for (const snippetDoc of snapshots.docs) {
    const data = snippetDoc.data();

    if (Array.isArray(data.snippets)) {
      for (const snippet of data.snippets) {
        if (!snippet) continue;
        snippets.push({
          id: snippet.id,
          rollNumber: snippet.rollNumber || snippetDoc.id,
          ...snippet,
        });
      }
      continue;
    }

    snippets.push({
      id: snippetDoc.id,
      rollNumber: data.rollNumber || snippetDoc.id,
      ...data,
    });
  }

  return snippets;
}

async function fetchCodeSnippetServer(id) {
  try {
    const snippetsRef = collection(CodelibraryDB, COLLECTION);
    const snapshots = await getDocs(snippetsRef);

    for (const snippetDoc of snapshots.docs) {
      const data = snippetDoc.data();

      if (Array.isArray(data.snippets)) {
        const found = data.snippets.find((snippet) => snippet?.id === id);
        if (found) {
          return {
            id: found.id,
            rollNumber: found.rollNumber || snippetDoc.id,
            ...found,
          };
        }
        continue;
      }

      if (snippetDoc.id === id) {
        return {
          id: snippetDoc.id,
          rollNumber: data.rollNumber || snippetDoc.id,
          ...data,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching code snippet:", error);
    return null;
  }
}

async function fetchAllCodeSnippetsServer() {
  try {
    const snippetsRef = collection(CodelibraryDB, COLLECTION);
    const snapshots = await getDocs(snippetsRef);
    return flattenSnippetDocuments(snapshots).sort(
      (left, right) => new Date(right.date || 0) - new Date(left.date || 0),
    );
  } catch (error) {
    console.error("Error fetching code snippets:", error);
    return [];
  }
}

export { fetchCodeSnippetServer, fetchAllCodeSnippetsServer };
