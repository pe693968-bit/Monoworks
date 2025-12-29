"use client";
import { useState } from "react";
import { useCompany } from "../context/CompanyContext";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { company, setCompany, loading, saveCompany, addloading } = useCompany();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Get role from localStorage (employee/admin)
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role === "admin";

  // Handle text fields (only if admin)
  const handleChange = (e) => {
    if (!isAdmin) return; // Prevent change for employees
    const { name, value } = e.target;
    setCompany({ ...company, [name]: value });
  };

  // Handle file input (Base64 store)
  const handleFileChange = (e) => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    if (!isAdmin) return;
    setCompany((prev) => ({ ...prev, logo: "" }));
  };

  // Save changes
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    saveCompany(company);
  };

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 w-full h-screen overflow-y-scroll relative">
        <MobileHeader toggleSidebar={toggleSidebar} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-[#003f20] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700 font-medium">Loading company details...</p>
            </div>
          </div>
        )}

        {!loading && company && (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-[#003f20]">Company Settings</h1>

            <div className="bg-white shadow-sm rounded-2xl p-6 max-w-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Logo
                  </label>

                  {isAdmin ? (
                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                  ) : null}

                  {company.logo ? (
                    <div className="relative mt-3 w-fit">
                      <img
                        src={company.logo}
                        alt="Company Logo"
                        className="h-20 w-20 object-cover border rounded-md shadow-sm"
                      />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 h-20 w-20 border rounded-md flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                      No Logo
                    </div>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <Input
                    name="name"
                    value={company.name}
                    onChange={handleChange}
                    readOnly={!isAdmin}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    name="address"
                    value={company.address}
                    onChange={handleChange}
                    readOnly={!isAdmin}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    name="phone"
                    value={company.phone}
                    onChange={handleChange}
                    readOnly={!isAdmin}
                  />
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms"
                    value={company.terms || ""}
                    onChange={handleChange}
                    rows={4}
                    readOnly={!isAdmin}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#003f20] focus:outline-none bg-gray-50"
                  ></textarea>
                </div>

                {/* Save Button */}
                {isAdmin && (
                  <Button type="submit" className="bg-[#003f20] text-white w-full">
                    {addloading ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
