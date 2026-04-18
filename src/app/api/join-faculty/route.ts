import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const position = formData.get("position") as string;
    const experience = formData.get("experience") as string;
    const qualification = formData.get("qualification") as string;
    const subjects = formData.get("subjects") as string;
    const message = formData.get("message") as string;
    const resumeFile = formData.get("resume") as File | null;

    // Validate required fields
    if (!name || !email || !phone || !position || !experience || !qualification || !subjects) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    let resumeUrl = null;

    // Upload resume to Cloudinary if provided
    if (resumeFile) {
      try {
        const bytes = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "gurukul/resumes",
              resource_type: "auto",
              format: "pdf",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        resumeUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Resume upload error:", uploadError);
        // Continue without resume if upload fails
      }
    }

    // Save to database
    await connectDB();
    const db = mongoose.connection.db!;
    const application = {
      name,
      email,
      phone,
      position,
      experience,
      qualification,
      subjects,
      message: message || "",
      resumeUrl,
      status: "pending",
      submittedAt: new Date(),
    };

    const result = await db.collection("faculty_applications").insertOne(application);

    // TODO: Send email notification to admin
    // You can integrate with your email service here

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Faculty application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all applications (admin only)
export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check for admin
    await connectDB();
    const db = mongoose.connection.db!;
    const applications = await db
      .collection("faculty_applications")
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update application status
export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db!;
    const { ObjectId } = await import("mongodb");
    
    const result = await db.collection("faculty_applications").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete an application
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db!;
    const { ObjectId } = await import("mongodb");
    
    const result = await db.collection("faculty_applications").deleteOne(
      { _id: new ObjectId(id) }
    );

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Application deleted" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
