import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDb } from "@/helpers/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDb();
    const { email, password, role } = await req.json();
    console.log(email,password,role);
    

    // 🚨 Admin Login Case
    if (role === "admin") {
      if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid Admin Credentials" },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { role: "admin", email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const response = NextResponse.json({
        success: true,
        message: "Admin Login Successful",
        token,
        user: { role: "admin", email },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 👤 Employee Login Case
    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json(
        { success: false, message: "Invalid Credentials!" },
        { status: 401 }
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return NextResponse.json(
        { success: false, message: "Invalid Credentials!" },
        { status: 401 }
      );

    const token = jwt.sign(
      { id: user._id, role: "employee", email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Employee Login Successful",
      token,
      user: {
        id: user._id,
        role: "employee",
        email: user.email,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
