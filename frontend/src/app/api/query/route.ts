import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

export async function POST(request: NextRequest) {
  try {
    const { question, session_id, use_web_search } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Question is required",
          details: "Please provide a question to ask",
        },
        { status: 400 }
      );
    }

    console.log("🤔 Processing question:", question);
    console.log("🔍 Session ID:", session_id);
    console.log("🌐 Web search:", use_web_search);

    // Call the Python backend with all parameters
    const response = await fetch(`${config.API_BASE_URL}/api/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        question,
        session_id,
        use_web_search: use_web_search !== false, // Default to true if not specified
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to query documents");
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Query processing error:", error);

    const errorMessage = "Error processing query";
    let details = "";

    if (error instanceof Error) {
      details = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: details,
      },
      { status: 500 }
    );
  }
}
