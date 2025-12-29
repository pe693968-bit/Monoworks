"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [role, setRole] = useState("employee"); // NEW ROLE STATE

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ===== Login =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.loading("Processing login...");

    try {
      const endpoint ="/api/auth/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success("Login Successful!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);

        role === "admin"
          ? router.push("/")
          : router.push("/");
      } else {
        toast.error(data.message || "Invalid login details");
      }
    } catch (err) {
      console.error("Login Error:", err);
      toast.error("Server error!");
    } finally {
      setLoading(false);
    }
  };

  // ===== Signup =====
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (role === "admin") {
      toast.error("Admin Signup Not Allowed!");
      setRole("employee");
      return setLoading(false);
    }

    toast.message("Creating account...");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success("Signup Successful!");
        setMode("login");
        setEmail("");
        setPassword("");
      } else {
        toast.error(data.message || "Signup Failed!");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      toast.error("Server error!");
    } finally {
      setLoading(false);
    }
  };

  // ===== Change Password =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.message("Updating password...");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success("Password Updated!");
        setMode("login");
        setEmail("");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (err) {
      console.error("Change Password Error:", err);
      toast.error("Server Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="bg-white w-[400px] p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-semibold text-center text-green-700 mb-6">
          {mode === "login"
            ? "Welcome Back 👋"
            : mode === "signup"
            ? "Create Account"
            : "Change Password"}
        </h2>

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Select */}
            <div>
              <label className="text-gray-700 text-sm font-medium">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-700 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Button */}
            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium"
            >
              {loading ? "Loading..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don’t have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-green-700 font-semibold">
                Sign up
              </button>
            </p>

            <p className="text-center text-sm text-gray-500">
              Forgot password?{" "}
              <button onClick={() => setMode("change")} className="text-green-700 font-semibold">
                Change Here
              </button>
            </p>
          </form>
        )}

        {/* SIGNUP */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role Select */}
            <div>
              <label className="text-gray-700 text-sm font-medium">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-700 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg">
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-green-700 font-semibold">
                Login
              </button>
            </p>
          </form>
        )}

        {/* CHANGE PASSWORD */}
        {mode === "change" && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-gray-700 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Current Password */}
            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">Current Password</label>
              <input
                type={showCurrent ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>

            {/* New Password */}
            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">New Password</label>
              <input
                type={showNew ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>

            <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg">
              {loading ? "Updating..." : "Change Password"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Back to{" "}
              <button onClick={() => setMode("login")} className="text-green-700 font-semibold">
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
