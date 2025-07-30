import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Code snippet ID is required" },
        { status: 400 }
      );
    }

    // Get the specific code snippet from Firebase
    const snippetRef = ref(db, `codeSnippets/${id}`);
    const snapshot = await get(snippetRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Code snippet not found" },
        { status: 404 }
      );
    }

    const snippetData = snapshot.val();

    // Return the snippet data
    return NextResponse.json({
      id,
      ...snippetData,
    });
  } catch (error) {
    console.error("Error fetching code snippet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
