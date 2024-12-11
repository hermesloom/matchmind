import { NextRequest, NextResponse } from "next/server";

export function handler(fn: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await fn(req);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  };
}
