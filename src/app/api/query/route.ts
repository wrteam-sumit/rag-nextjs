import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

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

    // Call the Python backend
    const response = await fetch(`${config.API_BASE_URL}/api/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
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
