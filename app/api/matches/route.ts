import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { Pinecone } from "@pinecone-database/pinecone";
import { getSubmissionBySecretKey, fetchEmbedding } from "../_common/utils";
import { handler } from "../_common/handler";

export const GET = handler(async (req: NextRequest) => {
  const secretKey = req.nextUrl.searchParams.get("secretKey");
  if (!secretKey) {
    throw new Error("secretKey is required");
  }

  const topKStr = req.nextUrl.searchParams.get("topK");
  if (!topKStr || isNaN(parseInt(topKStr))) {
    throw new Error("topK is required");
  }
  const topK = parseInt(topKStr);

  const submission = await getSubmissionBySecretKey(secretKey);
  const embedding = await fetchEmbedding(submission.id);
  if (!embedding) {
    throw new Error("embedding for submission not found: " + submission.id);
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const index = pinecone.Index("matchmind");
  const matches = await index.query({
    vector: embedding,
    topK: topK + 1,
  });

  const supabase = await createClient();
  const similarSubmissions = await query(() =>
    supabase
      .from("submissions")
      .select()
      .in(
        "id",
        matches.matches.map((m) => m.id).filter((id) => id !== submission.id)
      )
  );

  return NextResponse.json(
    matches.matches
      .filter((m) => m.id !== submission.id)
      .map((m) => {
        const submission = similarSubmissions.find((s: any) => s.id === m.id);
        if (submission) {
          return { id: submission.id, text: submission.text };
        }
      })
      .filter((x) => !!x)
      .slice(0, topK)
  );
});
