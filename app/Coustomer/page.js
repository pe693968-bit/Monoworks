"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import {
  UserPlus,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { toast } from "sonner"; // ✅ Toast Notifications

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 🧱 Skeleton Row for Loading
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b">
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
      <td className="p-3 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto"></div></td>
    </tr>
  );
}

export default function CustomerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    cnic: "",
  });
const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // 🧠 Fetch all customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Failed to load customers!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 🧠 Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🧠 Add New Customer
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, contact, address, cnic } = formData;

    if (!name || !contact || !address || !cnic) {
      toast.error("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Customer added successfully!");
        setFormData({ name: "", contact: "", address: "", cnic: "" });
        setIsDialogOpen(false);
        fetchCustomers();
      } else {
        toast.error("Failed to add customer!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding customer!");
    }
  };

  // 🧠 Delete Customer
  const deleteCustomer = async (id) => {
  

  try {
    const res = await fetch("/api/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      toast.success("Customer deleted!");
      fetchCustomers(); // 🔁 Refresh the list
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || "Failed to delete customer!");
    }
  } catch (err) {
    console.error("❌ Error deleting customer:", err);
    toast.error("Error deleting customer!");
  }
};


  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6 h-[100vh] overflow-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">
                Customer / Patient Management
              </h1>
              <p className="text-gray-500">
                Manage all customer and patient information
              </p>
            </div>

            {/* Add Customer Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition">
                  <UserPlus size={18} /> Add Customer
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-[#003f20] text-lg font-semibold">
                    Add New Customer
                  </DialogTitle>
                  <DialogDescription>
                    Fill out the details below to add a new customer or patient.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
                  {["name", "contact", "address", "cnic"].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {field}
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        placeholder={`Enter ${field}`}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#003f20] focus:outline-none"
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition"
                  >
                    Save Customer
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          {/* Table */}
          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow-sm">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#003f20] text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Name</th>
                  <th className="p-3 text-left text-sm font-semibold">Contact</th>
                  <th className="p-3 text-left text-sm font-semibold">Address</th>
                  <th className="p-3 text-left text-sm font-semibold">CNIC</th>
                  <th className="p-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr key={cust._id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 text-sm font-medium text-gray-800">{cust.name}</td>
                      <td className="p-3 text-sm text-gray-700">{cust.contact}</td>
                      <td className="p-3 text-sm text-gray-700">{cust.address}</td>
                      <td className="p-3 text-sm text-gray-700">{cust.cnic}</td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-gray-100 transition">
                              <MoreVertical size={18} className="text-gray-700" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-44 bg-white shadow-lg rounded-xl border border-gray-100">
  <DropdownMenuLabel className="text-xs text-gray-400">
    Actions
  </DropdownMenuLabel>
  <DropdownMenuSeparator />

  {/* Only show Delete for admin */}
  {role === "admin" && (
    <DropdownMenuItem
      onClick={() => deleteCustomer(cust._id)}
      className="flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:text-red-700"
    >
      <Trash2 size={15} /> Delete
    </DropdownMenuItem>
  )}
</DropdownMenuContent>

                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
