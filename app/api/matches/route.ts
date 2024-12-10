import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { Pinecone } from "@pinecone-database/pinecone";
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

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

  const supabase = await createClient();

  const submission = await query(() =>
    supabase.from("submissions").select().eq("secret_key", secretKey)
  );
  if (submission.length === 0) {
    return NextResponse.json(
      { error: "submission not found" },
      { status: 400 }
    );
  }

  const index = pinecone.Index("matchmind");
  const myEmbedding = await index.fetch([submission[0].id]);
  if (!myEmbedding.records[submission[0].id]) {
    return NextResponse.json(
      { error: "embedding for submission not found: " + submission[0].id },
      { status: 400 }
    );
  }

  const matches = await index.query({
    vector: myEmbedding.records[submission[0].id].values,
    topK: topK + 1,
  });

  const similarSubmissions = await query(() =>
    supabase
      .from("submissions")
      .select()
      .in(
        "id",
        matches.matches.map((m) => m.id).filter((id) => id !== submission[0].id)
      )
  );

  return NextResponse.json(
    similarSubmissions
      .slice(0, topK)
      .map((s: any) => ({ id: s.id, text: s.text }))
  );
}
