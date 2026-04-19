import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Note } from "@/lib/db/models/Note";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const standard = new URL(req.url).searchParams.get("standard");
    const query = standard ? { standard: new RegExp(`^${standard.trim()}$`, "i") } : {};
    const notes = await Note.find(query).sort({ created_at: -1 });
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, subject, standard, file_url, file_type } = await req.json();
    if (!title || !subject || !standard || !file_url) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 });
    }
    await connectDB();
    const note = await Note.create({ title, subject, standard, file_url, file_type: file_type || "pdf" });
    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || !mongoose.isValidObjectId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    await connectDB();
    await Note.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
