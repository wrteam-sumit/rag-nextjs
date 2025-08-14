import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Starting file upload process...");

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ No file found in form data");
      return NextResponse.json(
        {
          error: "No file uploaded",
          details: "Please select a file to upload",
        },
        { status: 400 }
      );
    }

    console.log("📄 File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Call the Python backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(
      `${config.API_BASE_URL}/api/documents/upload`,
      {
        method: "POST",
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
        body: backendFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload document");
    }

    const result = await response.json();
    console.log("✅ File uploaded and processed successfully");

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Upload processing error:", error);

    const errorMessage = "Error processing file";
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
