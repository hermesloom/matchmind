import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { Pinecone } from "@pinecone-database/pinecone";
import { getSubmissionBySecretKey, fetchEmbedding } from "../_common/utils";

export async function GET(req: NextRequest) {
  const secretKey = req.nextUrl.searchParams.get("secretKey");
  if (!secretKey) {
    return NextResponse.json(
      { error: "secretKey is required" },
      { status: 400 }
    );
  }

  const topKStr = req.nextUrl.searchParams.get("topK");
  if (!topKStr || isNaN(parseInt(topKStr))) {
    return NextResponse.json({ error: "topK is required" }, { status: 400 });
  }
  const topK = parseInt(topKStr);

  const submission = await getSubmissionBySecretKey(secretKey);
  const embedding = await fetchEmbedding(submission.id);
  if (!embedding) {
    return NextResponse.json(
      { error: "embedding for submission not found: " + submission.id },
      { status: 400 }
    );
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
    similarSubmissions
      .slice(0, topK)
      .map((s: any) => ({ id: s.id, text: s.text }))
  );
}
