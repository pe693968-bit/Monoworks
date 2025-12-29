"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const unprotectedRoutes = ["/login", "/signup"];

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Skip unprotected routes
        if (unprotectedRoutes.includes(pathname)) {
          setAuthChecked(true);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const data = await res.json();
        console.log("Profile Data:", data);

        if (!res.ok || !data.success) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          router.push("/login");
        } else {
          // ✅ Store role for future restrictions
          if (data.user && data.user.role) {
            localStorage.setItem("role", data.user.role);
          }
          setAuthChecked(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        router.push("/login");
      }
    };

    verifyAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return children;
}
