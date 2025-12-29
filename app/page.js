"use client";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Card from "./components/Card";
import Chart from "./components/Chart";
import MobileHeader from "./components/MobileHeader";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalCustomers: 0,
    totalPendingDues: 0,
    totalProducts: 0,
    graph: { months: [], income: [], expense: [] },
  });


  
  // Date filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
   const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

   useEffect(() => {
    
      if (role !== "admin") {
        toast.warning("You do not have access to the Dashboard. Redirecting...");
        router.push("/sales"); // redirect non-admins to sales page
      }
    
  }, []);

  const fetchDashboard = async (from = "", to = "") => {
  setLoading(true);
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    if (to && to > todayStr) to = todayStr;
    if (from && from > todayStr) from = todayStr;

    let url = "/api/dashboard";
    if (from && to) url += `?from=${from}&to=${to}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    const data = await res.json();

    setDashboardData({
      totalIncome: data.totalIncome || 0,
      totalExpense: data.totalExpense || 0,
      balance: data.balance || 0,
      totalCustomers: data.totalCustomers || 0,
      totalPendingDues: data.totalPendingDues || 0,
      totalProducts: data.totalProducts || 0,
      graph: data.graph || { months: [], income: [], expense: [] },
    });
    console.log(data.pendingDues);
    
    // ⚡ New: Show Pending Dues Notifications
    if (data.pendingDues && data.pendingDues.length > 0) {
  data.pendingDues.forEach((due) => {
    toast.warning(
      `⚠️ Payment Reminder`,
      {
        description: `${due.name} had a due amount of Rs. ${due.amount} (Due Date: ${new Date(
          due.dueDate
        ).toLocaleDateString()})`,
        duration: 8000,
      }
    );
  });
}


  } catch (err) {
    console.error(err);
    toast.error("Failed to load dashboard data!");
    setDashboardData({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      totalCustomers: 0,
      totalPendingDues: 0,
      totalProducts: 0,
      graph: { months: [], income: [], expense: [] },
    });
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDashboard();
}, []);


  // Quick filter logic
  const applyQuickFilter = (filter) => {
    setQuickFilter(filter);
    const today = new Date();
    let from = "",
      to = today.toISOString().split("T")[0];

    switch (filter) {
      case "last7":
        from = new Date(today.setDate(today.getDate() - 7))
          .toISOString()
          .split("T")[0];
        break;
      case "last30":
        from = new Date(today.setDate(today.getDate() - 30))
          .toISOString()
          .split("T")[0];
        break;
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        from = lastMonthStart.toISOString().split("T")[0];
        to = lastMonthEnd.toISOString().split("T")[0];
        break;
      default:
        break;
    }

    setFromDate(from);
    setToDate(to);
    fetchDashboard(from, to);
  };

  const applyCustomDateFilter = () => {
    if (!fromDate || !toDate) {
      toast.error("Select both From and To dates");
      return;
    }
    if (fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    setQuickFilter("");
    fetchDashboard(fromDate, toDate);
  };

  return (
    <main className="flex bg-gray-100 min-h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 w-full h-[100vh] overflow-y-auto">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6">
          <header>
            <h1 className="text-2xl text-black/70 font-bold">Dashboard</h1>
            <p className="text-gray-500">
              {fromDate && toDate
                ? `Showing Data: ${fromDate} to ${toDate}`
                : `Today: ${new Date().toLocaleDateString()}`}
            </p>
          </header>

          {/* Date Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
  <div className="flex flex-col gap-1">
    <label className="text-gray-600 text-sm">From Date</label>
    <input
      type="date"
      value={fromDate}
      max={new Date().toISOString().split("T")[0]}
      onChange={(e) => setFromDate(e.target.value)}
      className="p-2 border rounded-lg"
    />
  </div>

  <div className="flex flex-col gap-1">
    <label className="text-gray-600 text-sm">To Date</label>
    <input
      type="date"
      value={toDate}
      max={new Date().toISOString().split("T")[0]}
      onChange={(e) => setToDate(e.target.value)}
      className="p-2 border rounded-lg"
    />
  </div>

  <button
    onClick={applyCustomDateFilter}
    className="px-4 py-2 bg-[#003f20] text-white rounded-lg hover:bg-[#005f33] transition mt-6 sm:mt-0"
  >
    Apply
  </button>

  {/* Quick Filters */}
  <div className="flex gap-2 mt-4 sm:mt-0">
    {["last7", "last30", "thisMonth"].map((f) => (
      <button
        key={f}
        onClick={() => applyQuickFilter(f)}
        className={`px-3 py-1 rounded-lg border ${
          quickFilter === f
            ? "bg-[#003f20] text-white"
            : "bg-white text-gray-700"
        } hover:bg-[#003f20] hover:text-white transition`}
      >
        {f === "last7"
          ? "Last 7 Days"
          : f === "last30"
          ? "Last 30 Days"
          : "This Month"}
      </button>
    ))}
  </div>
</div>


          {/* Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            <Card
              title="Total Income"
              value={`Rs. ${dashboardData.totalIncome.toLocaleString()}`}
              change="+20.9%"
              positive
              loading={loading}
            />
            <Card
              title="Total Expense"
              value={`Rs. ${dashboardData.totalExpense.toLocaleString()}`}
              change="-5.2%"
              positive={false}
              loading={loading}
            />
            <Card
              title="Balance"
              value={`Rs. ${dashboardData.balance.toLocaleString()}`}
              change={dashboardData.balance >= 0 ? "+10%" : "-10%"}
              positive={dashboardData.balance >= 0}
              loading={loading}
            />
            <Card
              title="Customers"
              value={dashboardData.totalCustomers}
              change="+2.5%"
              positive
              loading={loading}
            />
            <Card
              title="Pending Dues"
              value={`Rs. ${dashboardData.totalPendingDues.toLocaleString()}`}
              change="-3%"
              positive={false}
              loading={loading}
            />
            <Card
              title="Products in Stock"
              value={dashboardData.totalProducts}
              change="+5%"
              positive
              loading={loading}
            />
          </section>

          {/* Chart */}
          <Chart
            months={dashboardData.graph.months}
            income={dashboardData.graph.income}
            expense={dashboardData.graph.expense}
            loading={loading}
          />
        </div>
      </div>
    </main>
  );
}
