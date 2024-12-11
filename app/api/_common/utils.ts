import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

export async function getSubmissionBySecretKey(secretKey: string) {
  if (!secretKey) {
    throw new Error("secretKey is required");
  }

  const supabase = await createClient();
  const submission = await query(() =>
    supabase.from("submissions").select().eq("secret_key", secretKey)
  );
  if (submission.length === 0) {
    throw new Error("submission not found");
  }
  return submission[0];
}

export async function fetchEmbedding(
  submissionId: string
): Promise<number[] | null> {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const index = pinecone.Index("matchmind");
  const myEmbedding = await index.fetch([submissionId]);
  if (!myEmbedding.records[submissionId]) {
    return null;
  }
  return myEmbedding.records[submissionId].values;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embeddingResponse.data[0].embedding;
}
