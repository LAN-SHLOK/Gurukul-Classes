import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Student } from "@/lib/db/models/Student";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/services/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, mobile, gender, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    await connectDB();

    // Check if email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Student
    const newStudent = new Student({
      first_name: firstName,
      last_name: lastName,
      email,
      mobile,
      gender,
      password: hashedPassword,
    });

    await newStudent.save();

    // Send Welcome Email
    try {
      await sendWelcomeEmail(email, firstName);
    } catch (emailErr) {
      console.error("[Register] Welcome email failed:", emailErr);
    }

    return NextResponse.json({ success: true, message: "Student registered successfully" });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
