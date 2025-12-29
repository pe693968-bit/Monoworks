"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import {
  Plus,
  MoreVertical,
  Trash2,
  Layers,
  DollarSign,
  Boxes,
  Edit,
} from "lucide-react";
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
import { toast } from "sonner";

export default function InventoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", unit: "", purchasePrice: "", quantity: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // For edit
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

// 1️⃣ Fetch products
const fetchProducts = async () => {
  try {
    setLoading(true);
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setProducts(data);
  } catch (err) {
    console.error("Error fetching inventory:", err);
  } finally {
    setLoading(false);
  }
};

// 2️⃣ Check for zero quantity whenever products change
useEffect(() => {
  if (products.length > 0) {
    products.forEach((product) => {
      if (product.quantity === 0) {
        toast.warning(`The quantity of "${product.name}" has reached 0!`);
      }
    });
  }
}, [products]);

// 3️⃣ Fetch products on component mount
useEffect(() => {
  fetchProducts();
}, []);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ADD or UPDATE PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editing ? "PUT" : "POST";
      const url = "/api/inventory";
      const body = JSON.stringify({
        ...form,
        id: editId,
        purchasePrice: Number(form.purchasePrice),
        quantity: Number(form.quantity),
      });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        await fetchProducts();
        setForm({
          name: "",
          category: "",
          unit: "",
          purchasePrice: "",
          quantity: "",
        });
        setEditing(false);
        setEditId(null);
        setOpenDialog(false);
      }
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditing(true);
    setEditId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      quantity: product.quantity,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const TableSkeleton = () => (
    <div className="rounded-2xl overflow-x-auto scrollbar-hide animate-pulse">
      <table className="min-w-full border-collapse">
        <thead className="bg-[#003f20] text-white">
          <tr>
            <th className="p-3 text-left text-sm font-semibold">Product</th>
            <th className="p-3 text-left text-sm font-semibold">Category</th>
            <th className="p-3 text-left text-sm font-semibold">Unit</th>
            <th className="p-3 text-left text-sm font-semibold">Purchase Price</th>
            <th className="p-3 text-left text-sm font-semibold">Quantity</th>
            <th className="p-3 text-left text-sm font-semibold">Total Value</th>
            <th className="p-3 text-center text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b">
              <td className="p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </td>
              <td className="p-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="p-3 text-center">
                <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">
                Product / Inventory Management
              </h1>
              <p className="text-gray-500">
                Manage all your product details and inventory levels
              </p>
            </div>

            {/* Add / Edit Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: "",
                      category: "",
                      unit: "",
                      purchasePrice: "",
                      quantity: "",
                    });
                  }}
                >
                  <Plus size={18} />
                  {submitting ? "Saving..." : "Add Product"}
                </button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editing
                      ? "Update the selected product details."
                      : "Enter product details below to add them to inventory."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Product name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#003f20]"
                  />
                  <input
                    type="text"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Category"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#003f20]"
                  />
                  <input
                    type="text"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="Unit (e.g. Box)"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#003f20]"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="purchasePrice"
                      value={form.purchasePrice}
                      onChange={handleChange}
                      placeholder="Purchase Price"
                      required
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#003f20]"
                    />
                    <input
                      type="number"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      placeholder="Quantity"
                      required
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#003f20]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition"
                  >
                    {submitting
                      ? "Saving..."
                      : editing
                      ? "Update Product"
                      : "Save Product"}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          {/* Table or Loader */}
          {loading ? (
            <TableSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              No products found. Add new ones to get started.
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="rounded-2xl overflow-x-auto scrollbar-hide">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#003f20] text-white">
                    <tr>
                      <th className="p-3 text-left text-sm font-semibold">Product</th>
                      <th className="p-3 text-left text-sm font-semibold">Category</th>
                      <th className="p-3 text-left text-sm font-semibold">Unit</th>
                      <th className="p-3 text-left text-sm font-semibold">Purchase Price</th>
                      <th className="p-3 text-left text-sm font-semibold">Quantity</th>
                      <th className="p-3 text-left text-sm font-semibold">Total Value</th>
                      <th className="p-3 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 text-sm text-gray-800 font-medium">{p.name}</td>
                        <td className="p-3 text-sm text-gray-700">{p.category}</td>
                        <td className="p-3 text-sm text-gray-700">{p.unit}</td>
                        <td className="p-3 text-sm text-gray-700">Rs. {p.purchasePrice}</td>
                        <td className="p-3 text-sm text-gray-700">{p.quantity}</td>
                        <td className="p-3 text-sm font-semibold text-[#003f20]">
                          Rs. {p.purchasePrice * p.quantity}
                        </td>

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
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-sm text-[#003f20] cursor-pointer hover:text-[#005f33]"
                                onClick={() => handleEdit(p)}
                              >
                                <Edit size={15} /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:text-red-700"
                                onClick={() => handleDelete(p._id)}
                              >
                                <Trash2 size={15} /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 bg-white shadow-sm rounded-2xl p-4 flex flex-wrap gap-6 justify-between">
                <div className="flex items-center gap-2 text-gray-700">
                  <Layers size={18} className="text-[#003f20]" />
                  <span>Total Products: {products.length}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign size={18} className="text-[#003f20]" />
                  <span>
                    Total Purchase Value: Rs.{" "}
                    {products
                      .reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Boxes size={18} className="text-[#003f20]" />
                  <span>
                    Total Quantity: {products.reduce((acc, p) => acc + p.quantity, 0)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
