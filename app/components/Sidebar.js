"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCompany } from "../context/CompanyContext";

// ✅ Icons
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Box,
  DollarSign,
  UserCheck,
  AlertTriangle,
  Settings,
  Receipt,
  RefreshCcw,
  LogOut,
  X,
} from "lucide-react";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const { company, loading } = useCompany();

  // 🔹 Logout function
  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      toast.success("Logged out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed!");
    }
  };

  // 🔹 Menu
  const menu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/", roles: ["admin"] },
    { name: "Sales", icon: <ShoppingCart size={20} />, href: "/sales", roles: ["admin", "employee"] },
    { name: "Invoice", icon: <Receipt size={20} />, href: "/invoice", roles: ["admin", "employee"] },
    { name: "Pending Dues", icon: <AlertTriangle size={20} />, href: "/pendingdues", roles: ["admin", "employee"] },
    { name: "Customers", icon: <Users size={20} />, href: "/Coustomer", roles: ["admin", "employee"] },
    { name: "Products / Inventory", icon: <Box size={20} />, href: "/inventory", roles: ["admin", "employee"] },
    { name: "Reports", icon: <FileText size={20} />, href: "/reports", roles: ["admin"] },
    { name: "Accounting", icon: <DollarSign size={20} />, href: "/accounting", roles: ["admin", "employee"] },
    { name: "Employees", icon: <UserCheck size={20} />, href: "/employ", roles: ["admin", "employee"] },
    { name: "Refunds", icon: <RefreshCcw size={20} />, href: "/refund", roles: ["admin", "employee"] },
    { name: "Company Settings", icon: <Settings size={20} />, href: "/settings", roles: ["admin", "employee"] },
  ];

  if (loading) return null;

  const userRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  // 🔹 Filter menu based on role
  const filteredMenu = menu.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Overlay (Mobile Only) */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed h-full inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-[100vh] bg-gray-50 border-r p-5 flex flex-col justify-between transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:w-60`}
      >
        {/* Company Name & Close Button */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-green-700">{company?.name}</h1>
            <button onClick={toggleSidebar} className="lg:hidden text-gray-600">
              <X size={22} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-2">
            {filteredMenu.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={i}
                  href={item.href}
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 p-2 rounded-lg transition
                    ${
                      isActive
                        ? "bg-[#003f20] text-white"
                        : "text-gray-700 hover:bg-[#003f20] hover:text-white"
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 🔹 Logout Button */}
        <div className="text-sm mt-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
