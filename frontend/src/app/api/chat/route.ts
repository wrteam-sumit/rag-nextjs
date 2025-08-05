import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

// GET - Get all chat sessions
export async function GET() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/chat/`);
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error("❌ Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

// POST - Create or update chat session
export async function POST(request: NextRequest) {
  try {
    const { session_id, title } = await request.json();

    if (!session_id || !title) {
      return NextResponse.json(
        { error: "Session ID and title are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${config.API_BASE_URL}/api/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id, title }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create chat session");
    }

    const session = await response.json();
    return NextResponse.json({ session });
  } catch (error) {
    console.error("❌ Error saving chat session:", error);
    return NextResponse.json(
      { error: "Failed to save chat session" },
      { status: 500 }
    );
  }
}

// DELETE - Delete chat session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${config.API_BASE_URL}/api/chat/${sessionId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete chat session");
    }

    return NextResponse.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 }
    );
  }
}
