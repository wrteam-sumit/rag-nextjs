import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

// GET - Get all documents with content preview
export async function GET() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/documents/`);
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const documents = await response.json();

    const documentsWithPreview = documents.map(
      (doc: {
        id: number;
        document_id: string;
        filename: string;
        file_type: string;
        file_size: number;
        text_length?: number;
        upload_date: string;
        text_content?: string;
        metadata_json?: Record<string, unknown>;
      }) => ({
        id: doc.id,
        documentId: doc.document_id,
        filename: doc.filename,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        textLength: doc.text_length,
        uploadDate: doc.upload_date,
        contentPreview: doc.text_content
          ? doc.text_content.substring(0, 1000) +
            (doc.text_content.length > 1000 ? "..." : "")
          : "No readable content found",
        metadata: doc.metadata_json,
      })
    );

    return NextResponse.json({
      documents: documentsWithPreview,
      total: documents.length,
    });
  } catch (error) {
    console.error("❌ Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${config.API_BASE_URL}/api/documents/${documentId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete document");
    }

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
