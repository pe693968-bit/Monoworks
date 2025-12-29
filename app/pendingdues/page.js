"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { MoreVertical, Bell, CheckCircle, Clock, Plus, Edit2 } from "lucide-react";
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

// 🧱 Skeleton Component for Loading State
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b">
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
      <td className="p-3 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
    </tr>
  );
}

export default function PendingDuesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [duesData, setDuesData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // For Add New Due
  const [editDialogOpen, setEditDialogOpen] = useState(false); // For Edit / Partial Payment
  const [currentDue, setCurrentDue] = useState(null); // Due being edited
  const [receivedAmount, setReceivedAmount] = useState(""); // Amount input
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // 🧠 Fetch all dues
  useEffect(() => {
    const fetchDues = async () => {
      try {
        const res = await fetch("/api/dues");
        const data = await res.json();
        setDuesData(data);
      } catch (err) {
        console.error("Error fetching dues:", err);
        toast.error("Failed to load dues!");
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
  }, []);

  const filteredDues = filter === "All" ? duesData : duesData.filter((d) => d.status === filter);

  // 🧠 Add New Due
  const handleAddDue = async (e) => {
    e.preventDefault();
    const form = e.target.form;
    const name = form[0].value;
    const contact = form[1].value;
    const amount = form[2].value;
    const dueDate = form[3].value;

    if (!name || !contact || !amount || !dueDate) {
      toast.error("Please fill all fields");
      return;
    }

    const newDue = { name, contact, amount, dueDate, status: "Pending" };

    try {
      const res = await fetch("/api/dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDue),
      });

      if (res.ok) {
        toast.success("New due added successfully!");
        setIsDialogOpen(false);
        const updated = await fetch("/api/dues").then((r) => r.json());
        setDuesData(updated);
      } else {
        toast.error("Failed to add new due!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding new due!");
    }
  };

  // 🧠 Mark as Cleared
  const markAsCleared = async (id) => {
    try {
      await fetch("/api/dues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Cleared" }),
      });
      toast.success("Marked as Cleared!");
      const updated = await fetch("/api/dues").then((r) => r.json());
      setDuesData(updated);
    } catch (err) {
      toast.error("Failed to update status!");
    }
  };

  // 🧠 Open Edit Dialog
  const openEditDialog = (due) => {
    setCurrentDue(due);
    setReceivedAmount("");
    setEditDialogOpen(true);
  };

  // 🧠 Handle Edit Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!receivedAmount) return toast.error("Enter received amount");

    const receivedNum = Number(receivedAmount);
    if (isNaN(receivedNum) || receivedNum <= 0 || receivedNum > currentDue.amount) {
      return toast.error("Invalid amount");
    }

    const newAmount = currentDue.amount - receivedNum;
    const newStatus = newAmount === 0 ? "Cleared" : "Pending";

    try {
      const res = await fetch("/api/dues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDue._id,
          amount: newAmount,
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success("Due updated successfully!");
        const updated = await fetch("/api/dues").then((r) => r.json());
        setDuesData(updated);
        setEditDialogOpen(false);
      } else {
        toast.error("Failed to update due!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating due!");
    }
  };

  // 🧠 Auto Highlight Logic
  const getHighlight = (dueDate, status) => {
    if (status === "Cleared") return "none";
    const today = new Date();
    const date = new Date(dueDate);
    const diffDays = (date - today) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return "red";
    if (diffDays <= 3) return "yellow";
    return "none";
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
              <h1 className="text-2xl font-bold text-[#003f20]">Pending Dues Management</h1>
              <p className="text-gray-500">Track and manage all pending payments</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {["All", "Pending", "Cleared"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    filter === tab
                      ? "bg-[#003f20] text-white"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab === "Cleared" ? "Paid" : tab}
                </button>
              ))}

              {/* Add Due Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition">
                    <Plus size={18} /> Add Due
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#003f20] text-lg font-semibold">Add New Pending Due</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 mt-3">
                    <div>
                      <label className="text-sm text-gray-700">Customer Name</label>
                      <input type="text" placeholder="Enter customer name" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Contact</label>
                      <input type="text" placeholder="03xx-xxxxxxx" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    </div>
                    <div className="flex gap-3">
                      <div className="w-1/2">
                        <label className="text-sm text-gray-700">Amount</label>
                        <input type="text" placeholder="Rs. 0" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                      </div>
                      <div className="w-1/2">
                        <label className="text-sm text-gray-700">Due Date</label>
                        <input type="date" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                      </div>
                    </div>
                    <button type="button" onClick={handleAddDue} className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition">
                      Save Due
                    </button>
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
                  <th className="p-3 text-left text-sm font-semibold">Customer</th>
                  <th className="p-3 text-left text-sm font-semibold">Contact</th>
                  <th className="p-3 text-left text-sm font-semibold">Pending Amount</th>
                  <th className="p-3 text-left text-sm font-semibold">Due Date</th>
                  <th className="p-3 text-left text-sm font-semibold">Status</th>
                  <th className="p-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                ) : filteredDues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No pending dues found.</td>
                  </tr>
                ) : (
                  filteredDues.map((due) => {
                    const highlight = getHighlight(due.dueDate, due.status);
                    return (
                      <tr key={due._id} className={`border-b transition ${
                        highlight === "red" ? "bg-red-50 hover:bg-red-100" :
                        highlight === "yellow" ? "bg-yellow-50 hover:bg-yellow-100" :
                        "hover:bg-gray-50"
                      }`}>
                        <td className="p-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                          <Bell size={16} className={`${highlight === "red" ? "text-red-600" : highlight === "yellow" ? "text-yellow-500" : "text-gray-400"}`} />
                          {due.name}
                        </td>
                        <td className="p-3 text-sm text-gray-700">{due.contact}</td>
                        <td className="p-3 text-sm text-gray-800 font-semibold">Rs. {due.amount}</td>
                        <td className="p-3 text-sm text-gray-700">{due.dueDate}</td>
                        <td className={`p-3 text-sm font-medium ${due.status === "Cleared" ? "text-green-600" : "text-red-600"}`}>{due.status}</td>
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
                              <DropdownMenuItem
                                onClick={() => markAsCleared(due._id)}
                                className="flex items-center gap-2 text-sm text-green-600 cursor-pointer hover:text-green-700"
                              >
                                <CheckCircle size={15} /> Mark as Cleared
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(due)}
                                className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700"
                              >
                                <Edit2 size={15} /> Partial Payment / Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-[#003f20]">
                                <Clock size={15} /> View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🟢 Edit Partial Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#003f20] text-lg font-semibold">
              Partial Payment / Edit
            </DialogTitle>
          </DialogHeader>
          {currentDue && (
            <form className="space-y-4 mt-3" onSubmit={handleEditSubmit}>
              <div>
                <label className="text-sm text-gray-700">Customer Name</label>
                <input type="text" value={currentDue.name} disabled className="w-full mt-1 p-2 border rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Current Amount</label>
                <input type="text" value={currentDue.amount} disabled className="w-full mt-1 p-2 border rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Received Amount</label>
                <input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} placeholder="Enter received amount" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
              </div>
              <button type="submit" className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition">
                Update Due
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
