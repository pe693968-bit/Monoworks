"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { MoreVertical, CheckCircle, Bell, Plus, Search } from "lucide-react";
import { toast } from "sonner";

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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Skeleton for loading state
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b">
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
      <td className="p-3 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
    </tr>
  );
}

export default function EmployeesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // Component ke start me, EmployeesPage function ke andar
const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        toast.error("Failed to load employees!");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Filter employees by name
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const form = e.target.form;
    const name = form[0].value;
    const profession = form[1].value;
    const empId = form[2].value;
    const address = form[3].value;
    const contact = form[4].value;
    const salary = form[5].value;

    if (!name || !profession || !empId || !address || !contact || !salary) {
      toast.error("Please fill all fields");
      return;
    }

    const newEmployee = { name, profession, empId, address, contact, salary, status: "Pending" };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });

      if (res.ok) {
        toast.success("Employee added successfully!");
        setIsDialogOpen(false);
        const updated = await fetch("/api/employees").then(r => r.json());
        setEmployees(updated);
      } else {
        toast.error("Failed to add employee!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding employee!");
    }
  };

  // Mark salary as Paid
  // Toggle salary status
const toggleSalaryStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === "Paid" ? "Pending" : "Paid";

  try {
    await fetch("/api/employees", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    toast.success(`Salary marked as ${newStatus}!`);
    const updated = await fetch("/api/employees").then(r => r.json());
    setEmployees(updated);
  } catch (err) {
    toast.error("Failed to update status!");
  }
};
// Delete employee
const deleteEmployee = async (id) => {
  

  try {
    const res = await fetch("/api/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      toast.success("Employee deleted successfully!");
      const updated = await fetch("/api/employees").then(r => r.json());
      setEmployees(updated);
    } else {
      toast.error("Failed to delete employee!");
    }
  } catch (err) {
    console.error(err);
    toast.error("Error deleting employee!");
  }
};



  // Highlight logic
  const getHighlight = (status) => status === "Paid" ? "green" : "red";

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6 h-[100vh] overflow-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">Employee Management</h1>
              <p className="text-gray-500">Track employee details & salary status</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 rounded-lg border w-64 focus:outline-none focus:ring-2 focus:ring-[#003f20]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              {/* Add Employee Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition">
                    <Plus size={18} /> Add Employee
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#003f20] text-lg font-semibold">Add New Employee</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 mt-3">
                    <div><label className="text-sm text-gray-700">Name</label><input type="text" placeholder="Employee Name" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" /></div>
                    <div><label className="text-sm text-gray-700">Profession</label><input type="text" placeholder="e.g., Developer" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" /></div>
                    <div><label className="text-sm text-gray-700">Employee ID</label><input type="text" placeholder="EMP001" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" /></div>
                    <div><label className="text-sm text-gray-700">Address</label><input type="text" placeholder="City, Country" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" /></div>
                    <div><label className="text-sm text-gray-700">Contact Number</label><input type="text" placeholder="03xx-xxxxxxx" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" /></div>
                    <div><label className="text-sm text-gray-700">Monthly Salary</label><input type="text" placeholder="Rs. 0" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" /></div>
                    <button type="button" onClick={handleAddEmployee} className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition">Save Employee</button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Table */}
          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow-sm">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#003f20] text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Name</th>
                  <th className="p-3 text-left text-sm font-semibold">Profession</th>
                  <th className="p-3 text-left text-sm font-semibold">Employee ID</th>
                  <th className="p-3 text-left text-sm font-semibold">Address</th>
                  <th className="p-3 text-left text-sm font-semibold">Contact</th>
                  <th className="p-3 text-left text-sm font-semibold">Salary</th>
                  <th className="p-3 text-left text-sm font-semibold">Status</th>
                  <th className="p-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  : filteredEmployees.length === 0
                  ? <tr><td colSpan={8} className="p-4 text-center text-gray-500">No employees found.</td></tr>
                  : filteredEmployees.map(emp => {
                      const highlight = getHighlight(emp.status);
                      return (
                        <tr key={emp._id} className={`border-b transition ${highlight === "red" ? "bg-red-50 hover:bg-red-100" : "bg-green-50 hover:bg-green-100"}`}>
                          <td className="p-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                            <Bell size={16} className={highlight === "red" ? "text-red-600" : "text-green-600"} /> {emp.name}
                          </td>
                          <td className="p-3 text-sm text-gray-700">{emp.profession}</td>
                          <td className="p-3 text-sm text-gray-700">{emp.empId}</td>
                          <td className="p-3 text-sm text-gray-700">{emp.address}</td>
                          <td className="p-3 text-sm text-gray-700">{emp.contact}</td>
                          <td className="p-3 text-sm text-gray-800 font-semibold">Rs. {emp.salary}</td>
                          <td className={`p-3 text-sm font-medium ${emp.status === "Paid" ? "text-green-600" : "text-red-600"}`}>{emp.status}</td>
                          <td className="p-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 rounded-full hover:bg-gray-100 transition">
                                  <MoreVertical size={18} className="text-gray-700" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-44 bg-white shadow-lg rounded-xl border border-gray-100">
  <DropdownMenuLabel className="text-xs text-gray-400">Actions</DropdownMenuLabel>
  <DropdownMenuSeparator />

  {/* Only admin can mark salary and delete */}
  {role === "admin" && (
    <>
      <DropdownMenuItem
        onClick={() => toggleSalaryStatus(emp._id, emp.status)}
        className={`flex items-center gap-2 text-sm cursor-pointer ${
          emp.status === "Paid" ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
        }`}
      >
        <CheckCircle size={15} />
        {emp.status === "Paid" ? "Mark as Unpaid" : "Mark as Paid"}
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => deleteEmployee(emp._id)}
        className="flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:text-red-700"
      >
        Delete
      </DropdownMenuItem>
    </>
  )}
</DropdownMenuContent>

                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
