import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // ✅ Get token from cookie or header
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.split(" ")[1];

    if (!token)
      return NextResponse.json({ success: false, message: "No token found" }, { status: 401 });

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      success: true,
      message: "Token verified",
      user: decoded,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
