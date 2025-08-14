import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

// GET - Get messages for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    const url = sessionId
      ? `${config.API_BASE_URL}/api/messages/?session_id=${sessionId}`
      : `${config.API_BASE_URL}/api/messages/`;

    const response = await fetch(url, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated, return empty messages
        return NextResponse.json({ messages: [] });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const messages = await response.json();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Save a message
export async function POST(request: NextRequest) {
  try {
    const { session_id, type, content, sources, metadata } =
      await request.json();

    if (!session_id || !type || !content) {
      return NextResponse.json(
        { error: "Session ID, type, and content are required" },
        { status: 400 }
      );
    }

    if (type !== "user" && type !== "assistant") {
      return NextResponse.json(
        { error: "Type must be 'user' or 'assistant'" },
        { status: 400 }
      );
    }

    const response = await fetch(`${config.API_BASE_URL}/api/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        session_id,
        type,
        content,
        sources,
        metadata,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated
        return NextResponse.json(
          { error: "Authentication required. Please log in." },
          { status: 401 }
        );
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create message");
    }

    const message = await response.json();
    return NextResponse.json({ message });
  } catch (error) {
    console.error("❌ Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
