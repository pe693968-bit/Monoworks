"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AccountingPageUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("Select Customer");
  const [salesRecords, setSalesRecords] = useState([]);
  const [pendingDues, setPendingDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch all customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        setCustomers(["All", ...data.map(c => c.name)]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load customers!");
      }
    };
    fetchCustomers();
  }, []);

  // Fetch sales & dues for selected customer
  useEffect(() => {
    if (selectedCustomer === "Select Customer" || selectedCustomer === "All") {
      setSalesRecords([]);
      setPendingDues([]);
      return;
    }

    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer-data?name=${selectedCustomer}`);
        const data = await res.json();
        setSalesRecords(data.sales || []);
        setPendingDues(data.dues || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load customer data!");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [selectedCustomer]);

  // Filter sales & dues based on date
 // Filter sales & dues based on date
const filteredSales = salesRecords.filter(rec => {
  if (fromDate && rec.date < fromDate) return false;
  if (toDate && rec.date > toDate) return false;
  return true;
});

// Pending dues filter based on createdAt (or date) instead of dueDate
// Pending dues filter based on createdAt
const filteredDues = pendingDues.filter(rec => {
  if (!rec.createdAt) return false;

  const recordDate = new Date(rec.createdAt);
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;

  // Set time to 00:00:00 for accurate comparison ignoring time
  recordDate.setHours(0,0,0,0);
  if (from) from.setHours(0,0,0,0);
  if (to) to.setHours(0,0,0,0);

  if (from && recordDate < from) return false;
  if (to && recordDate > to) return false;

  return true;
});


  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6 h-[100vh] overflow-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">Accounting</h1>
              <p className="text-gray-500">Sales report & pending dues</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Customer Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white border px-4 py-2 rounded-lg shadow hover:bg-gray-50">
                    {selectedCustomer} <span className="ml-2">▼</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Select Customer</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {customers.map(cust => (
                    <DropdownMenuItem key={cust} onClick={() => setSelectedCustomer(cust)}>
                      {cust}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Filters */}
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]"
                placeholder="From Date"
              />
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]"
                placeholder="To Date"
              />
            </div>
          </header>

          {/* Sales Table */}
          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow mt-4">
            <h2 className="p-4 text-lg font-semibold text-[#003f20]">Sales</h2>
            <table className="min-w-full border-collapse">
              <thead className="bg-[#003f20] text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Code</th>
                  <th className="p-3 text-left text-sm font-semibold">Bill To</th>
                  <th className="p-3 text-left text-sm font-semibold">Date</th>
                  <th className="p-3 text-left text-sm font-semibold">Total Items</th>
                  <th className="p-3 text-left text-sm font-semibold">Rate</th>
                  <th className="p-3 text-left text-sm font-semibold">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedCustomer === "Select Customer" ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      Please select a customer to view data.
                    </td>
                  </tr>
                ) : loading ? (
                  <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No sales found.</td></tr>
                ) : (
                  filteredSales.map((rec, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 text-sm text-gray-700">{rec.code}</td>
                      <td className="p-3 text-sm text-gray-700">{rec.billTo}</td>
                      <td className="p-3 text-sm text-gray-500">{rec.date}</td>
                      <td className="p-3 text-sm text-gray-700">{rec.items.length}</td>
                      <td className="p-3 text-sm text-gray-700">
                        Rs. {rec.items.length > 0 ? (rec.items.reduce((sum, i) => sum + i.rate, 0) / rec.items.length).toFixed(2) : 0}
                      </td>
                      <td className="p-3 text-sm font-semibold">Rs. {rec.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pending Dues Table */}
          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow mt-8">
            <h2 className="p-4 text-lg font-semibold text-[#003f20]">Pending Dues</h2>
            <table className="min-w-full border-collapse">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Customer</th>
                  <th className="p-3 text-left text-sm font-semibold">Contact</th>
                  <th className="p-3 text-left text-sm font-semibold">Pending Amount</th>
                  <th className="p-3 text-left text-sm font-semibold">Due Date</th>
                  <th className="p-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
  {selectedCustomer === "Select Customer" ? (
    <tr>
      <td colSpan={5} className="p-4 text-center text-gray-500">
        Please select a customer to view data.
      </td>
    </tr>
  ) : loading ? (
    <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
  ) : filteredDues.length === 0 ? (
    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No pending dues.</td></tr>
  ) : (
    filteredDues.map((rec, idx) => (
      <tr key={idx} className="border-b hover:bg-red-50 transition">
        <td className="p-3 text-sm text-gray-700">{rec.name}</td>
        <td className="p-3 text-sm text-gray-700">{rec.contact}</td>
        <td className="p-3 text-sm font-semibold">Rs. {rec.amount}</td>
        <td className="p-3 text-sm text-gray-500">
  {new Date(rec.createdAt).toLocaleDateString("en-GB")}
</td>
        <td className="p-3 text-sm font-medium text-red-600">{rec.status}</td>
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
