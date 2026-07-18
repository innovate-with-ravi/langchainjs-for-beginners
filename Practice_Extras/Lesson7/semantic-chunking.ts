import { type Embeddings } from "@langchain/core/embeddings";

// Utility: Calculates how similar two vectors are (returns 0 to 1)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += Math.pow(vecA[i], 2);
    normB += Math.pow(vecB[i], 2);
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// The Core Semantic Chunker
// the semanticChunker will give unstrutured text but it will be more meaningfull
export async function semanticChunker(
  text: string,
  embeddingsModel: Embeddings, // e.g., new OpenAIEmbeddings()
  similarityThreshold: number = 0.65 // The drop-off point for a topic shift
): Promise<string[]> {
  // 1. Split text into raw sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [text];

  if (sentences.length <= 1) return sentences;

  // 2. Generate mathematical vectors for EVERY sentence
  const embeddings = await embeddingsModel.embedDocuments(sentences);

  const chunks: string[] = [];
  let currentChunk = sentences[0]; // string ""

  // 3. Group sentences based on meaning
  for (let i = 1; i < sentences.length; i++) {
    // Compare the current sentence to the previous one
    const similarity = cosineSimilarity(embeddings[i - 1], embeddings[i]);

    if (similarity >= similarityThreshold) {
      // The topic is the same -> keep building the chunk
      currentChunk += " " + sentences[i];
    } else {
      // The similarity dropped -> Topic shift detected!
      // Save the chunk and start a fresh one.
      chunks.push(currentChunk);
      currentChunk = sentences[i];
    }
  }

  chunks.push(currentChunk);
  return chunks;
}

/*
You only use it when context is fragile.

Dense Technical Docs: When dealing with API references, complex legal contracts, or medical records where cutting a sentence in half ruins the entire explanation.

High-Stakes Accuracy: When your RAG system's retrieval accuracy is failing because standard splitters are grouping unrelated paragraphs together just to fill a 1,000-character quota.
*/

// The Big Trade-off (Cost & Time): You should be aware that semantic chunking is expensive. You have to pay an API (like OpenAI) to embed the document sentence-by-sentence just to calculate where to slice it, and then you typically embed the final joined chunks again to store them in your database.
