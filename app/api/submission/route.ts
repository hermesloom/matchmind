import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from "uuid";
import {
  getSubmissionBySecretKey,
  generateEmbedding,
  fetchEmbedding,
} from "../_common/utils";
import { handler } from "../_common/handler";

export const GET = handler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  const secretKey = req.nextUrl.searchParams.get("secretKey");
  if (!id && !secretKey) {
    throw new Error("id or secretKey is required");
  }

  if (id) {
    const supabase = await createClient();
    const submission = await query(() =>
      supabase.from("submissions").select().eq("id", id)
    );
    if (submission.length === 0) {
      throw new Error("submission not found");
    }
    return NextResponse.json(submission[0]);
  } else if (secretKey) {
    const submission = await getSubmissionBySecretKey(secretKey);
    return NextResponse.json(submission);
  }

  return NextResponse.json({});
});

export const POST = handler(async (req: NextRequest) => {
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

  const embedding = await generateEmbedding(text);
  pinecone.Index("matchmind").upsert([{ id: submissionId, values: embedding }]);
  while (!(await fetchEmbedding(submissionId))) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return NextResponse.json({ secretKey });
});

export const PATCH = handler(async (req: NextRequest) => {
  const { secretKey, text } = await req.json();
  const submission = await getSubmissionBySecretKey(secretKey);
  if (submission.text === text) {
    return NextResponse.json({});
  }

  const supabase = await createClient();
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  if (text === "") {
    await query(() =>
      supabase.from("messages").delete().eq("to_submission_id", submission.id)
    );
    await query(() =>
      supabase.from("messages").delete().eq("from_submission_id", submission.id)
    );
    await query(() =>
      supabase.from("submissions").delete().eq("id", submission.id)
    );
    pinecone.Index("matchmind").deleteOne(submission.id);
  } else {
    await query(() =>
      supabase.from("submissions").update({ text }).eq("id", submission.id)
    );

    const newEmbedding = await generateEmbedding(text);
    pinecone
      .Index("matchmind")
      .upsert([{ id: submission.id, values: newEmbedding }]);
  }

  return NextResponse.json({});
});
