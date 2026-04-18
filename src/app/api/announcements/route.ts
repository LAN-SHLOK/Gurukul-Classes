import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Announcement } from "@/lib/db/models/Announcement";
import Pusher from "pusher";

function getPusher() {
  if (!process.env.PUSHER_APP_ID) return null;
  return new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER || "ap2",
    useTLS: true,
  });
}

export async function GET() {
  try {
    await connectDB();
    const ann = await Announcement.findOne({ active: true }).sort({ created_at: -1 });
    return NextResponse.json(ann || null, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate" },
    });
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ message: "Text required" }, { status: 400 });
    await connectDB();
    await Announcement.updateMany({}, { active: false });
    const ann = await Announcement.create({ text: text.trim(), active: true });

    // Push real-time announcement to all connected students
    const pusher = getPusher();
    if (pusher) {
      await pusher.trigger("gurukul", "announcement", { text: text.trim() });
    }

    return NextResponse.json({ success: true, data: ann }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || !mongoose.isValidObjectId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    await connectDB();
    await Announcement.findByIdAndUpdate(id, { active: false });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
