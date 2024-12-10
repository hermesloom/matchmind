import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "../_common/query";

export async function GET(req: NextRequest) {
  const toSecretKey = req.nextUrl.searchParams.get("toSecretKey");
  if (!toSecretKey) {
    return NextResponse.json(
      { error: "toSecretKey is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const toSubmission = await query(() =>
    supabase.from("submissions").select().eq("secret_key", toSecretKey)
  );
  if (toSubmission.length === 0) {
    return NextResponse.json([]);
  }

  const messages = await query(() =>
    supabase
      .from("messages")
      .select()
      .eq("to_submission_id", toSubmission[0].id)
      .order("created_at", { ascending: false })
  );

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { text, fromSecretKey, toSubmissionId } = await req.json();
  if (!text || !fromSecretKey || !toSubmissionId) {
    return NextResponse.json(
      { error: "text, fromSecretKey, and toSubmissionId are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const fromSubmission = await query(() =>
    supabase.from("submissions").select().eq("secret_key", fromSecretKey)
  );
  if (fromSubmission.length === 0) {
    return NextResponse.json(
      { error: "fromSubmission not found" },
      { status: 400 }
    );
  }

  const toSubmission = await query(() =>
    supabase.from("submissions").select().eq("id", toSubmissionId)
  );
  if (toSubmission.length === 0) {
    return NextResponse.json(
      { error: "toSubmission not found" },
      { status: 400 }
    );
  }

  await query(() =>
    supabase.from("messages").insert({
      text,
      from_submission_id: fromSubmission[0].id,
      to_submission_id: toSubmission[0].id,
    })
  );

  return NextResponse.json({ status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const supabase = await createClient();
  await query(() => supabase.from("messages").delete().eq("id", id));
  return NextResponse.json({ status: 200 });
}
