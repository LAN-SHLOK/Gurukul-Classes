import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rate-limiter";

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";
const FALLBACK = "Our AI assistant is temporarily unavailable. Please contact us at Gurukulclasses001@gmail.com or call +91 88490 35591.";

export async function POST(request: NextRequest) {
  // Rate Limiting: 5 requests per minute
  const ip = getIP(request);
  const { success } = await rateLimit(`ai-search:${ip}`, 5, 60000);
  
  if (!success) {
    return NextResponse.json(
      { success: false, answer: "Slow down, mentor! You're asking questions too fast. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const { query } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ success: false, answer: FALLBACK }, { status: 400 });
    }

    const res = await fetch(`${PYTHON_AI_URL}/api/academic-mentor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[AI Search] Python service error:", res.status, err);
      return NextResponse.json({ success: true, answer: FALLBACK });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, answer: data.answer || FALLBACK });

  } catch (error: any) {
    console.error("[AI Search] Error:", error?.message || error);
    return NextResponse.json({ success: true, answer: FALLBACK });
  }
}
