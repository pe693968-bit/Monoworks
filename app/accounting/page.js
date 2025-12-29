"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";
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

// Skeleton row for loading
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
}

export default function ExpensesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch("/api/accounting");
        const data = await res.json();
        // Only keep Expense type
        setExpenses(data.filter(r => r.type === "Expense"));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load expenses!");
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // Add new expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const form = e.target.form;
    const description = form[0].value;
    const amount = form[1].value;
    const paymentMethod = form[2].value;
    const source = form[3].value;
    const category = form[4].value;
    const notes = form[5].value;

    if (!description || !amount || !paymentMethod || !source || !category) {
      toast.error("Please fill all required fields!");
      return;
    }

    const newExpense = {
      description,
      type: "Expense",
      amount,
      paymentMethod,
      source,
      category,
      notes,
      date: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });

      if (res.ok) {
        toast.success("Expense added successfully!");
        setIsDialogOpen(false);
        const updated = await fetch("/api/accounting")
          .then(r => r.json())
          .then(data => data.filter(r => r.type === "Expense"));
        setExpenses(updated);
      } else {
        toast.error("Failed to add expense!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding expense!");
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch("/api/accounting", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Expense deleted!");
        setExpenses(prev => prev.filter(e => e._id !== id));
      } else {
        toast.error("Failed to delete expense!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting expense!");
    }
  };

  // Filtered expenses by description
  const filteredExpenses = expenses.filter(rec =>
    rec.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6 h-[100vh] overflow-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">Expenses</h1>
              <p className="text-gray-500">Manage all your expenses</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 rounded-lg border w-64 focus:outline-none focus:ring-2 focus:ring-[#003f20]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              {/* Add Expense */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition">
                    <Plus size={18} /> Add Expense
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#003f20] text-lg font-semibold">Add New Expense</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 mt-3">
                    <input type="text" placeholder="Description" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    <input type="number" placeholder="Amount" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    <select className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]">
                      <option value="">Select Payment Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online">Online</option>
                    </select>
                    <input type="text" placeholder="Paid To" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    <select className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]">
                      <option value="">Select Category</option>
                      <option value="Office">Office</option>
                      <option value="Food">Food</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Salary">Salary</option>
                      <option value="Other">Other</option>
                    </select>
                    <textarea placeholder="Notes" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]"></textarea>
                    <button type="button" onClick={handleAddExpense} className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition">Save Expense</button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Table */}
          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow-sm mt-4">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#003f20] text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Description</th>
                  <th className="p-3 text-left text-sm font-semibold">Amount</th>
                  <th className="p-3 text-left text-sm font-semibold">Payment Method</th>
                  <th className="p-3 text-left text-sm font-semibold">Paid To</th>
                  <th className="p-3 text-left text-sm font-semibold">Category</th>
                  <th className="p-3 text-left text-sm font-semibold">Notes</th>
                  <th className="p-3 text-left text-sm font-semibold">Date</th>
                  <th className="p-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  : filteredExpenses.length === 0
                  ? <tr><td colSpan={8} className="p-4 text-center text-gray-500">No expenses found.</td></tr>
                  : filteredExpenses.map(rec => (
                      <tr key={rec._id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 text-sm text-gray-700">{rec.description}</td>
                        <td className="p-3 text-sm font-semibold">Rs. {rec.amount}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.paymentMethod}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.source}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.category}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.notes}</td>
                        <td className="p-3 text-sm text-gray-500">{new Date(rec.date).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-gray-100 transition">
                                <MoreVertical size={18} className="text-gray-700" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-36 bg-white shadow-lg rounded-xl border border-gray-100">
  <DropdownMenuLabel className="text-xs text-gray-400">Actions</DropdownMenuLabel>
  <DropdownMenuSeparator />

  {/* Only show Delete for admin */}
  {role === "admin" && (
    <DropdownMenuItem
      onClick={() => deleteExpense(rec._id)}
      className="flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:text-red-700"
    >
      <Trash2 size={15} /> Delete
    </DropdownMenuItem>
  )}
</DropdownMenuContent>

                          </DropdownMenu>
                        </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
