import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";
import { handler } from "../_common/handler";
import { getSubmissionBySecretKey } from "../_common/utils";

export const GET = handler(async (req: NextRequest) => {
  const toSecretKey = req.nextUrl.searchParams.get("toSecretKey");
  if (!toSecretKey) {
    throw new Error("toSecretKey is required");
  }

  const supabase = await createClient();
  const toSubmission = await getSubmissionBySecretKey(toSecretKey);

  const messages = await query(() =>
    supabase
      .from("messages")
      .select()
      .eq("to_submission_id", toSubmission.id)
      .order("created_at", { ascending: false })
  );

  return NextResponse.json(messages);
});

export const POST = handler(async (req: NextRequest) => {
  const { text, fromSecretKey, toSubmissionId } = await req.json();
  if (!text || !fromSecretKey || !toSubmissionId) {
    throw new Error("text, fromSecretKey, and toSubmissionId are required");
  }

  const supabase = await createClient();
  const fromSubmission = await query(() =>
    supabase.from("submissions").select().eq("secret_key", fromSecretKey)
  );
  if (fromSubmission.length === 0) {
    throw new Error("fromSubmission not found");
  }

  const toSubmission = await query(() =>
    supabase.from("submissions").select().eq("id", toSubmissionId)
  );
  if (toSubmission.length === 0) {
    throw new Error("toSubmission not found");
  }

  await query(() =>
    supabase.from("messages").insert({
      text,
      from_submission_id: fromSubmission[0].id,
      to_submission_id: toSubmission[0].id,
    })
  );

  return NextResponse.json({ status: 200 });
});

export const DELETE = handler(async (req: NextRequest) => {
  const { id } = await req.json();
  const supabase = await createClient();
  await query(() => supabase.from("messages").delete().eq("id", id));
  return NextResponse.json({ status: 200 });
});
