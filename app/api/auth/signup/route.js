import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDb } from "@/helpers/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDb();
    const { email, password } = await req.json();

    // Check if any user already exists
    const existingUser = await User.findOne({});
    if (existingUser) {
      return NextResponse.json(
        { message: "A user already exists. Signup disabled." },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create first (and only) user
    const user = await User.create({ email, password: hashedPassword });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
