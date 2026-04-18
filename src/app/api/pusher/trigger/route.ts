import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const { event, data } = await req.json();

    if (!event || !data) {
      return NextResponse.json({ error: "event and data required" }, { status: 400 });
    }

    await pusher.trigger("gurukul", event, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Pusher] trigger error:", error);
    return NextResponse.json({ error: "Failed to trigger event" }, { status: 500 });
  }
}
