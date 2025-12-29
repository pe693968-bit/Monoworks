import { connectDb } from "@/helpers/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

connectDb();

export async function POST(req) {
  try {
    const { email, currentPassword, newPassword } = await req.json();

    // 🧠 Validation
    if (!email || !currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, message: "All fields are required!" }),
        { status: 400 }
      );
    }

    // 🔍 Find user
    const user = await User.findOne({ email });
    if (!user)
      return new Response(
        JSON.stringify({ success: false, message: "User not found!" }),
        { status: 404 }
      );

    // 🔒 Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return new Response(
        JSON.stringify({ success: false, message: "Incorrect current password!" }),
        { status: 401 }
      );

    // 🚫 Prevent same password reuse
    if (currentPassword === newPassword)
      return new Response(
        JSON.stringify({ success: false, message: "New password cannot be same as current!" }),
        { status: 400 }
      );

    // ✅ Hash and update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return new Response(
      JSON.stringify({ success: true, message: "Password changed successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Change Password Error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error!" }),
      { status: 500 }
    );
  }
}
