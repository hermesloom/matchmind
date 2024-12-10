import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await createClient();
  const submission = await query(() =>
    supabase.from("submissions").select().eq("id", id)
  );
  if (submission.length === 0) {
    return NextResponse.json(
      { error: "submission not found" },
      { status: 400 }
    );
  }

  return NextResponse.json(submission[0]);
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  const { text } = await req.json();
  const supabase = await createClient();

  const secretKey = uuidv4();
  const submissionId = (
    await query(() =>
      supabase
        .from("submissions")
        .insert({ text, secret_key: secretKey })
        .select()
        .single()
    )
  ).id;

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  const embedding = embeddingResponse.data[0].embedding;
  pinecone.Index("matchmind").upsert([{ id: submissionId, values: embedding }]);
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({ secretKey });
}

export async function DELETE(req: NextRequest) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  const { id } = await req.json();
  const supabase = await createClient();
  await query(() => supabase.from("submissions").delete().eq("id", id));
  pinecone.Index("matchmind").deleteOne(id);
  return NextResponse.json({});
}
