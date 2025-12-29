"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SalesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchInvoices:", err);
      toast.error("Failed to load invoices!");
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = invoices.filter((inv) =>
    (inv.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full overflow-y-scroll h-screen">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">Sales / Invoice Module</h1>
              <p className="text-gray-500">View all your invoices</p>
            </div>
            <Input
              placeholder="Search by code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </header>

          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow-sm">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#003f20] text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Code</th>
                  <th className="p-3 text-left text-sm font-semibold">Bill To</th>
                  <th className="p-3 text-left text-sm font-semibold">Date</th>
                  <th className="p-3 text-left text-sm font-semibold">Total Items</th>
                  <th className="p-3 text-left text-sm font-semibold">Total Qty</th>
                  <th className="p-3 text-left text-sm font-semibold">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-3"><Skeleton className="h-4 w-24 rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-28 rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-20 rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-20 rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-16 rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-20 rounded-md" /></td>
                      </tr>
                    ))
                  : filteredInvoices.length === 0
                  ? (
                    <tr><td colSpan={6} className="p-4 text-center">No invoices found.</td></tr>
                  )
                  : filteredInvoices.map((inv) => {
                      const totalQty = inv.items.reduce((sum, i) => sum + (i.qty || 0), 0);
                      return (
                        <tr
                          key={inv._id}
                          className="border-b hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => router.push(`/sale/${inv._id}`)}
                        >
                          <td className="p-3 text-sm text-gray-700">{inv.code}</td>
                          <td className="p-3 text-sm text-gray-700">{inv.billTo}</td>
                          <td className="p-3 text-sm text-gray-700">{inv.date}</td>
                          <td className="p-3 text-sm text-gray-700">{inv.items.length}</td>
                          <td className="p-3 text-sm text-gray-700">{totalQty}</td>
                          <td className="p-3 text-sm text-gray-700 font-semibold">Rs. {inv.total}</td>
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
