import { NextResponse } from "next/server";
import { runTimeRulesTick } from "@/features/platform";
import crypto from "crypto";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Jika tidak disetel di env development, izinkan untuk lokal jika non-production
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(cronSecret);

  if (tokenBuf.length !== secretBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const summary = await runTimeRulesTick(now);

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    summary,
  });
}

export async function POST(request: Request) {
  return GET(request);
}

