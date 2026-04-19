import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAdminNote } from "@/lib/services/admin-ai";
import { rateLimit, getIP } from "@/lib/rate-limiter";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db/mongodb";
import { Note } from "@/lib/db/models/Note";

// Allow up to 60 seconds for AI generation + PDF + upload
export const maxDuration = 60;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  // 1. Auth Check
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Admin Rate Limit (50 per hour)
  const ip = getIP(req);
  const { success } = await rateLimit(`admin-ai:${ip}`, 50, 3600000);
  if (!success) {
    return NextResponse.json({ error: "Admin quota exceeded. Please wait an hour." }, { status: 429 });
  }

  try {
    const { prompt, title, subject, standard } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const noteTitle = title || prompt.substring(0, 30);

    // 3. Generate AI content
    const result = await generateAdminNote(prompt);
    const content = result.markdown;
    const imagePrompts = result.image_prompts || [];

    // 4. Build PDF
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;

    // Branding header
    doc.setFillColor(45, 49, 250);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("GURUKUL CLASSES — ACADEMIC EXCELLENCE", pageWidth / 2, 13, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(noteTitle, margin, 40);
    y = 55;

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 7;
    });

    // Embed AI-generated images
    for (const imgPrompt of imagePrompts) {
      try {
        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=800&height=600&nologo=true`;
        const imgRes = await fetch(imgUrl);
        const imgBuf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(imgBuf).toString("base64");
        if (y > 200) { doc.addPage(); y = 20; }
        doc.addImage(`data:image/jpeg;base64,${base64}`, "JPEG", margin, y, pageWidth - margin * 2, 80);
        y += 90;
      } catch {
        console.error(`[AI-Generate] Image fetch failed for prompt: ${imgPrompt}`);
      }
    }

    const pdfBuffer = doc.output("arraybuffer");

    // 5. Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "gurukul/notes/automated",
          resource_type: "raw",
          format: "pdf",
        },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(Buffer.from(pdfBuffer));
    });

    // 6. Save to MongoDB
    await connectDB();
    await Note.create({
      title: noteTitle,
      subject: subject || "General",
      standard: standard || "N/A",
      file_url: uploadResult.secure_url,
    });

    return NextResponse.json({
      success: true,
      message: "Note generated and saved successfully",
      file_url: uploadResult.secure_url,
      content: content.substring(0, 200) + "...",
    });
  } catch (error: any) {
    console.error("[Admin AI] Generation failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
