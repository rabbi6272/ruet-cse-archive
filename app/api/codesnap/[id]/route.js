import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";

async function fetchCodeSnippetById(id) {
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
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Code snippet ID is required" },
        { status: 400 },
      );
    }

    const snippetData = await fetchCodeSnippetById(id);

    if (!snippetData) {
      return NextResponse.json(
        { error: "Code snippet not found" },
        { status: 404 },
      );
    }

    // Return the snippet data
    return NextResponse.json({
      ...snippetData,
    });
  } catch (error) {
    console.error("Error fetching code snippet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
