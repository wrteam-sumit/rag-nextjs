import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../../lib/config";

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the Python backend
    const response = await fetch(`${config.API_BASE_URL}/api/query/domains`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || "Failed to fetch assistants" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
