import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../lib/config";

// POST - Clear all data (documents, messages, chat sessions)
export async function POST(request: NextRequest) {
  try {
    console.log("🗑️ Starting complete data cleanup...");

    let deletedDocuments = 0;
    let deletedChats = 0;
    let deletedMessages = 0;

    // Step 1: Clear all messages first (to avoid foreign key constraints)
    try {
      console.log("📝 Step 1: Clearing messages...");
      const messagesResponse = await fetch(
        `${config.API_BASE_URL}/api/messages/clear-all`,
        {
          method: "DELETE",
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        }
      );
      if (messagesResponse.ok) {
        const result = await messagesResponse.json();
        const match = result.message.match(/Deleted (\d+) messages/);
        deletedMessages = match ? parseInt(match[1]) : 0;
        console.log(`✅ Cleared ${deletedMessages} messages`);
      } else {
        console.log(
          `⚠️ Messages clear-all endpoint failed with status: ${messagesResponse.status}`
        );
        const errorText = await messagesResponse.text();
        console.log(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.log("⚠️ Messages clear-all failed:", error);
    }

    // Small delay to ensure database operations complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Step 2: Clear all documents (including vector database)
    try {
      console.log("📄 Step 2: Clearing documents...");
      const documentsResponse = await fetch(
        `${config.API_BASE_URL}/api/documents/clear-all`,
        {
          method: "DELETE",
          headers: {
            cookie: request.headers.get("cookie") || "",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
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

        // Additional verification - check if documents are really cleared
        setTimeout(async () => {
          try {
            const verifyResponse = await fetch(
              `${config.API_BASE_URL}/api/documents/`,
              {
                headers: {
                  cookie: request.headers.get("cookie") || "",
                  "Cache-Control": "no-cache",
                },
              }
            );
            if (verifyResponse.ok) {
              const documents = await verifyResponse.json();
              console.log(
                `🔍 Verification: Found ${documents.length} documents after clear`
              );
              if (documents.length > 0) {
                console.warn(
                  `⚠️ Warning: ${documents.length} documents still exist after clear operation`
                );
              }
            }
          } catch (error) {
            console.error("Error verifying document clear:", error);
          }
        }, 1000);
      } else {
        console.error(
          `Failed to clear documents with status: ${documentsResponse.status}`
        );
        const errorText = await documentsResponse.text();
        console.error(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.error("Failed to clear documents:", error);
    }

    // Small delay to ensure database operations complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Step 3: Get all chat sessions and delete them
    try {
      console.log("💬 Step 3: Clearing chat sessions...");
      const chatResponse = await fetch(`${config.API_BASE_URL}/api/chat/`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });
      if (chatResponse.ok) {
        const chatSessions = await chatResponse.json();
        console.log(`Found ${chatSessions.length} chat sessions to delete`);

        for (const session of chatSessions) {
          try {
            const deleteResponse = await fetch(
              `${config.API_BASE_URL}/api/chat/${session.session_id}`,
              {
                method: "DELETE",
                headers: {
                  cookie: request.headers.get("cookie") || "",
                },
              }
            );
            if (deleteResponse.ok) {
              deletedChats++;
            } else {
              console.error(
                `Failed to delete chat session ${session.session_id}:`,
                deleteResponse.status
              );
              const errorText = await deleteResponse.text();
              console.error(`Error response: ${errorText}`);
            }
          } catch (error) {
            console.error(
              `Failed to delete chat session ${session.session_id}:`,
              error
            );
          }
        }
        console.log(`✅ Deleted ${deletedChats} chat sessions`);
      } else {
        console.error(
          `Failed to fetch chat sessions with status: ${chatResponse.status}`
        );
        const errorText = await chatResponse.text();
        console.error(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.error("Failed to clear chat sessions:", error);
    }

    console.log("✅ Complete data cleanup finished");
    console.log(
      `📊 Summary: ${deletedMessages} messages, ${deletedDocuments} documents, ${deletedChats} chat sessions`
    );

    return NextResponse.json({
      success: true,
      message: "All data cleared successfully",
      deletedDocuments: deletedDocuments || 0,
      deletedChats: deletedChats || 0,
      deletedMessages: deletedMessages || 0,
    });
  } catch (_error) {
    console.error("❌ Error during complete data cleanup");
    return NextResponse.json(
      { error: "Failed to clear all data" },
      { status: 500 }
    );
  }
}
