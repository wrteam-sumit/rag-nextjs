import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

const COLLECTION_NAME = "documents";
const VECTOR_SIZE = 768; // Gemini embedding size

// Type for Qdrant search result
interface QdrantSearchResult {
  score: number;
  payload: Record<string, unknown>;
}

// Ensure the collection exists
async function ensureCollection() {
  try {
    const collections = await client.getCollections();
    if (
      !collections.collections.some(
        (c: { name: string }) => c.name === COLLECTION_NAME
      )
    ) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
      });
      console.log(`✅ Created Qdrant collection: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error("❌ Error ensuring Qdrant collection:", error);
    throw error;
  }
}

// Store document in Qdrant
export async function addDocumentToQdrant(
  id: string,
  text: string,
  embeddings: number[],
  metadata: Record<string, string | number | boolean>
) {
  try {
    await ensureCollection();
    await client.upsert(COLLECTION_NAME, {
      points: [
        {
          id,
          vector: embeddings,
          payload: { ...metadata, text },
        },
      ],
    });
    console.log("✅ Document added to Qdrant:", id);
  } catch (error) {
    console.error("❌ Error adding document to Qdrant:", error);
    throw error;
  }
}

// Search documents in Qdrant
export async function searchDocumentsInQdrant(
  queryEmbeddings: number[],
  limit: number = 3
): Promise<QdrantSearchResult[]> {
  try {
    await ensureCollection();
    const result = await client.search(COLLECTION_NAME, {
      vector: queryEmbeddings,
      limit,
      with_payload: true,
    });
    return result.map((hit) => ({
      score: hit.score,
      payload: hit.payload || {},
    }));
  } catch (error) {
    console.error("❌ Error searching Qdrant:", error);
    throw error;
  }
}

// Delete document from Qdrant
export async function deleteDocumentFromQdrant(id: string) {
  try {
    await ensureCollection();
    await client.delete(COLLECTION_NAME, {
      points: [id],
    });
    console.log("✅ Document deleted from Qdrant:", id);
  } catch (error) {
    console.error("❌ Error deleting document from Qdrant:", error);
    throw error;
  }
}

// Get collection info
export async function getCollectionInfo() {
  try {
    const collections = await client.getCollections();
    const collection = collections.collections.find(
      (c: { name: string }) => c.name === COLLECTION_NAME
    );
    return collection;
  } catch (error) {
    console.error("❌ Error getting collection info:", error);
    throw error;
  }
}

// Check if Qdrant is available
export async function checkQdrantConnection(): Promise<boolean> {
  try {
    await client.getCollections();
    return true;
  } catch (error) {
    console.error("❌ Qdrant connection failed:", error);
    return false;
  }
}
