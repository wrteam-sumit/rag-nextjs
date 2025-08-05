import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

// POST - Clear all data (documents, messages, chat sessions)
export async function POST(request: NextRequest) {
  try {
    console.log("🗑️ Starting complete data cleanup...");

    let deletedDocuments = 0;
    let deletedChats = 0;

    // Step 1: Clear all documents (including vector database)
    try {
      const documentsResponse = await fetch(
        `${config.API_BASE_URL}/api/documents/clear-all`,
        {
          method: "DELETE",
        }
      );
      if (documentsResponse.ok) {
        const result = await documentsResponse.json();
        // Extract number from message like "Deleted 6 documents from the database"
        const match = result.message.match(/Deleted (\d+) documents/);
        deletedDocuments = match ? parseInt(match[1]) : 0;
        console.log(
          `✅ Cleared ${deletedDocuments} documents from database and vector store`
        );
      }
    } catch (error) {
      console.error("Failed to clear documents:", error);
    }

    // Step 2: Get all chat sessions and delete them
    const chatResponse = await fetch(`${config.API_BASE_URL}/api/chat/`);
    if (chatResponse.ok) {
      const chatSessions = await chatResponse.json();

      for (const session of chatSessions) {
        try {
          const deleteResponse = await fetch(
            `${config.API_BASE_URL}/api/chat/${session.session_id}`,
            {
              method: "DELETE",
            }
          );
          if (deleteResponse.ok) {
            deletedChats++;
          }
        } catch (error) {
          console.error(
            `Failed to delete chat session ${session.session_id}:`,
            error
          );
        }
      }
      console.log(`✅ Deleted ${deletedChats} chat sessions`);
    }

    // Step 3: Clear all messages (if there's a bulk delete endpoint)
    try {
      const messagesResponse = await fetch(
        `${config.API_BASE_URL}/api/messages/clear-all`,
        {
          method: "DELETE",
        }
      );
      if (messagesResponse.ok) {
        console.log("✅ Cleared all messages");
      }
    } catch (error) {
      console.log("⚠️ No bulk message deletion endpoint available");
    }

    console.log("✅ Complete data cleanup finished");

    return NextResponse.json({
      success: true,
      message: "All data cleared successfully",
      deletedDocuments: deletedDocuments || 0,
      deletedChats: deletedChats || 0,
    });
  } catch (error) {
    console.error("❌ Error during complete data cleanup:", error);
    return NextResponse.json(
      { error: "Failed to clear all data" },
      { status: 500 }
    );
  }
}
