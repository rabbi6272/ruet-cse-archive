// Server-side data fetching utilities for code library
// Note: This uses the Firebase Admin SDK or REST API for server-side operations

async function fetchCodeSnippetServer(id) {
  try {
    // Use Firebase REST API for server-side fetching
    const databaseURL = "https://last-197cd-default-rtdb.firebaseio.com";
    const response = await fetch(`${databaseURL}/codeSnippets/${id}.json`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      return null;
    }

    return {
      id,
      ...data,
    };
  } catch (error) {
    console.error("Error fetching code snippet:", error);
    return null;
  }
}

async function fetchAllCodeSnippetsServer() {
  try {
    const databaseURL = "https://last-197cd-default-rtdb.firebaseio.com";
    const response = await fetch(`${databaseURL}/codeSnippets.json`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      return [];
    }

    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
  } catch (error) {
    console.error("Error fetching code snippets:", error);
    return [];
  }
}

export { fetchCodeSnippetServer, fetchAllCodeSnippetsServer };
