import { NextResponse } from "next/server";
import { fetchCodeSnippetServer } from "@/lib/codelibrary/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Code snippet ID is required" },
        { status: 400 },
      );
    }

    const snippetData = await fetchCodeSnippetServer(id);

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
