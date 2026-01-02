"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Plus, Search, MoreVertical, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RefundsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState([]);

  const [form, setForm] = useState({
    customer: "",
    customerId: "",
    product: "",
    productId: "",
    qty: 1,
    amount: "",
    reason: "",
    status: "Pending",
  });

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");
        const  data  = await res.json();
        console.log('customer data', data);
        
        setCustomers(data || []);
      } catch (err) {
        console.error("Error fetching customers:", err);
        toast.error("Failed to load customers!");
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    console.log(customers, products);
    
  }, [customers, products])
  

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await fetch("/api/refund");
        const { data } = await res.json();
        console.log(data);
        
        setRefunds(data || []);
      } catch (err) {
        console.error("Error fetching refunds:", err);
        toast.error("Failed to load refunds!");
      } finally {
        setLoading(false);
      }
    };
    fetchRefunds();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/inventory");
        const  data  = await res.json();
        console.log('products data', data);
        
        setProducts(data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Failed to load products!");
      }
    };
    fetchProducts();
  }, []);

  /* ================= CUSTOMER SUGGESTION ================= */

  const handleCustomerInput = (value) => {
    setForm({ ...form, customer: value });
    if (!value) return setCustomerSuggestions([]);

    setCustomerSuggestions(
      customers.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const selectCustomer = (c) => {
    setForm({
      ...form,
      customer: c.name,
      customerId: c._id,
    });
    setCustomerSuggestions([]);
  };

  /* ================= PRODUCT SUGGESTION ================= */

  const handleProductInput = (value) => {
    setForm({ ...form, product: value });
    if (!value) return setProductSuggestions([]);

    setProductSuggestions(
      products.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const selectProduct = (p) => {
    setForm({
      ...form,
      product: p.name,
      productId: p._id,
      amount: p.purchasePrice || "",
    });
    setProductSuggestions([]);
  };

  /* ================= ADD REFUND ================= */

  const addRefund = async () => {
    if (!form.customerId || !form.productId || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.qty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      // Backend expects items array + customerName
      const payload = {
        customerId: form.customerId,
        customerName: form.customer, // Add customer name
        items: [
          {
            productId: form.productId,
            qty: Number(form.qty),
            amount: Number(form.amount),
          },
        ],
        reason: form.reason,
        // status: form.status, // Remove status if schema doesn't have it
      };

      console.log("Sending payload:", payload);

      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add refund");
      }

      toast.success("Refund added successfully!");
      setDialogOpen(false);

      // Refresh refunds
      const updatedRes = await fetch("/api/refund");
      const updatedData = await updatedRes.json();
      setRefunds(updatedData.data || []);

      // Reset form
      setForm({
        customer: "",
        customerId: "",
        product: "",
        productId: "",
        qty: 1,
        amount: "",
        reason: "",
        status: "Pending",
      });
    } catch (err) {
      console.error("Add refund error:", err);
      toast.error(err.message || "Failed to add refund");
    }
  };

  /* ================= REFUND ACTIONS ================= */

  const handleApprove = async (refundId) => {
    try {
      const res = await fetch("/api/refund/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundId }),
      });

      if (!res.ok) throw new Error("Failed to approve");

      toast.success("Refund approved!");
      // Refresh data
      const updated = await fetch("/api/refund").then((r) => r.json());
      setRefunds(updated.data || []);
    } catch (err) {
      toast.error("Failed to approve refund");
    }
  };

 const handleDelete = async (refundId) => {
  if (!confirm("Are you sure you want to delete this refund? This action cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch("/api/refund", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: refundId }), // ← ID body mein bhej rahe hain
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to delete refund");
    }

    toast.success(result.message || "Refund deleted successfully!");

    // Refresh refunds list
    const updatedRes = await fetch("/api/refund");
    const updatedData = await updatedRes.json();
    setRefunds(updatedData.data || []);

  } catch (err) {
    console.error("Delete refund error:", err);
    toast.error(err.message || "Failed to delete refund");
  }
};

  /* ================= FILTER REFUNDS ================= */

  const filteredRefunds = refunds.filter((refund) =>
    refund.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    refund.customerId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Flatten refunds into individual item rows for table display
  const refundRows = filteredRefunds.flatMap((refund) =>
    refund.items.map((item, index) => ({
      id: refund._id,
      itemIndex: index,
      customerName: refund.customerName || refund.customerId?.name || "Unknown",
      productName: item.productId?.name || "Unknown Product",
      qty: item.qty,
      amount: item.amount,
      reason: refund.reason,
      status: refund.status || "Pending",
      refundDate: refund.refundDate,
      method: refund.method,
    }))
  );

  /* ================= UI ================= */

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-4 md:p-6 space-y-6 h-[100vh] overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#003f20]">
                Refund Management
              </h1>
              <p className="text-gray-500 text-sm">Track and manage customer refunds</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  placeholder="Search refunds..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] focus:border-transparent"
                />
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition font-medium">
                    <Plus size={18} /> Add Refund
                  </button>
                </DialogTrigger>

                <DialogContent className="rounded-xl max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-[#003f20]">Create New Refund</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Customer */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer *
                      </label>
                      <input
                        placeholder="Search customer..."
                        value={form.customer}
                        onChange={(e) => handleCustomerInput(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33]"
                      />
                      {customerSuggestions.length > 0 && (
                        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                          {customerSuggestions.map((c) => (
                            <li
                              key={c._id}
                              onClick={() => selectCustomer(c)}
                              className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{c.name}</div>
                              <div className="text-sm text-gray-500">{c.phone}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Product */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <input
                        placeholder="Search product..."
                        value={form.product}
                        onChange={(e) => handleProductInput(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33]"
                      />
                      {productSuggestions.length > 0 && (
                        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                          {productSuggestions.map((p) => (
                            <li
                              key={p._id}
                              onClick={() => selectProduct(p)}
                              className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-sm text-gray-500">{p.category}</div>
                              </div>
                              <div className="text-sm text-gray-600">
                                Rs. {p.purchasePrice}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={form.qty}
                          onChange={(e) =>
                            setForm({ ...form, qty: Math.max(1, e.target.value) })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount *
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={form.amount}
                          onChange={(e) =>
                            setForm({ ...form, amount: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason (optional)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Reason for refund..."
                        value={form.reason}
                        onChange={(e) =>
                          setForm({ ...form, reason: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] resize-none"
                      />
                    </div>

                    <button
                      onClick={addRefund}
                      disabled={!form.customerId || !form.productId || !form.amount}
                      className="w-full bg-[#003f20] text-white py-3 rounded-lg font-medium hover:bg-[#005f33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Refund
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#003f20] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                      Amount
                    </th>
                    
                    <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003f20]"></div>
                          <span>Loading refunds...</span>
                        </div>
                      </td>
                    </tr>
                  ) : refundRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {search ? "No refunds found for this search" : "No refunds yet. Create your first refund!"}
                      </td>
                    </tr>
                  ) : (
                    refundRows.map((row) => (
                      <tr key={`${row.id}-${row.itemIndex}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {row.customerName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {row.productName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-gray-700">{row.qty}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            Rs. {Number(row.amount).toLocaleString("en-PK")}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {new Date(row.refundDate).toLocaleDateString("en-PK")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                                <MoreVertical size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              
                              <DropdownMenuItem
                                onClick={() => handleDelete(row.id)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 size={16} /> Delete
                              </DropdownMenuItem>
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

          {/* Summary */}
          {!loading && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Total Refunds: {refunds.length}</span>
                <span className="font-medium text-[#003f20]">
                  Total Amount: Rs.{" "}
                  {refunds
                    .reduce((sum, r) => sum + r.items.reduce((iSum, i) => iSum + i.amount, 0), 0)
                    .toLocaleString("en-PK")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}