"use client";
import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "../context/CompanyContext";

export default function InvoicePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [products, setProducts] = useState([]);
const [searchSuggestions, setSearchSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [customerList, setCustomerList] = useState([]);
const [customerSuggestions, setCustomerSuggestions] = useState([]);
const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
const { company, loading } = useCompany();



  const [logo, setLogo] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const fileRef = useRef(null);

const [form, setForm] = useState({
  from: "",
  billTo: "",
  shipTo: "",
  invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().slice(0, 10),
  paymentTerms: "",
  dueDate: "",
  poNumber: "",
  notes: "",
  terms: "",
  customerData: {}, // ✅ added for full customer info
});


  const [items, setItems] = useState([
    { id: Date.now(), description: "", qty: 1, rate: 0, amount: 0 },
  ]);

  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shipping, setShipping] = useState(0);

  
  function updateForm(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function addItem() {
    setItems((p) => [...p, { id: Date.now() + Math.random(), description: "", qty: 1, rate: 0, amount: 0 }]);
  }

  function removeItem(id) {
    setItems((p) => p.filter((i) => i.id !== id));
  }

  function updateItem(id, key, value) {
    setItems((p) =>
      p.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [key]: value };
        const qty = Number(updated.qty) || 0;
        const rate = Number(updated.rate) || 0;
        updated.amount = +(qty * rate).toFixed(2);
        return updated;
      })
    );
  }

  const [subtotal, setSubtotal] = useState(0);
const [taxAmount, setTaxAmount] = useState(0);
const [discountAmount, setDiscountAmount] = useState(0);
const [total, setTotal] = useState(0);
const [balanceDue, setBalanceDue] = useState(0);

useEffect(() => {
  const sub = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const taxAmt = +(sub * (Number(taxPercent) || 0) / 100).toFixed(2);
  const discountAmt = +(sub * (Number(discountPercent) || 0) / 100).toFixed(2);
  const totalAmt = +(sub + taxAmt - discountAmt + Number(shipping || 0)).toFixed(2);
  const due = Math.max(totalAmt - Number(amountPaid || 0), 0);

  setSubtotal(sub);
  setTaxAmount(taxAmt);
  setDiscountAmount(discountAmt);
  setTotal(totalAmt);
  setBalanceDue(Number(due.toFixed(2)));

  // 🔍 Debug logs (optional)
  console.log("✅ Subtotal:", sub, "| Total:", totalAmt, "| Paid:", amountPaid, "| Due:", due);
}, [items, taxPercent, discountPercent, shipping, amountPaid]);







useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/inventory"); // ✅ Fetch once
      const data = await res.json();
      setProducts(data); // Store all products in state
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  fetchProducts();
}, []); // ✅ only run once

const handleCustomerInput = (value) => {
  updateForm("billTo", value);

  if (value.trim().length > 0) {
    const matches = customerList.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );
    setCustomerSuggestions(matches);
    setShowCustomerSuggestions(true);
  } else {
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
  }
};

useEffect(() => {
  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomerList(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Failed to load customers!");
    }
  };
  fetchCustomers();
}, []);


const handleSelectCustomer = (customer) => {
  console.log(customer);
  
  updateForm("billTo", customer.name);
  updateForm("poNumber", customer.contact || "");
  console.log('ponumber', customer.phone);
  
  updateForm("customerData", {
    id: customer._id,
    name: customer.name,
    phone: customer.contact,
    email: customer.email || "",
    address: customer.address || "",
    city: customer.city || "",
  });
  setShowCustomerSuggestions(false);
};







const handleDescriptionInput = (id, value) => {
  // Update description field in items
  updateItem(id, "description", value);

  if (value.trim().length > 0) {
    // Filter products from already fetched data
    const matches = products.filter((p) =>
      p.name.toLowerCase().includes(value.toLowerCase())
    );

    // 🔥 Suggestion state per item ID ke hisab se manage kar rahe hain
    setSearchSuggestions((prev) => ({ ...prev, [id]: matches }));
    setShowSuggestions((prev) => ({ ...prev, [id]: true }));
  } else {
    setSearchSuggestions((prev) => ({ ...prev, [id]: [] }));
    setShowSuggestions((prev) => ({ ...prev, [id]: false }));
  }
};

// ✅ When user selects a product from suggestion
const handleSelectSuggestion = (id, product) => {
  setItems((prev) =>
    prev.map((it) =>
      it.id === id
        ? {
            ...it,
            description: product.name,
            productId: product._id, // ✅ Add this line
            qty: 1,
            rate: product.purchasePrice || 0,
            amount: product.purchasePrice || 0,
          }
        : it
    )
  );

  setShowSuggestions((prev) => ({ ...prev, [id]: false }));
};



async function handleDownloadPDF() {
  let processingToast;
  try {
    processingToast = toast.loading("🧾 Generating invoice, please wait...");

    // ===== Prepare Invoice Data =====
    const invoiceData = {
      ...form,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      taxPercent: Number(taxPercent) || 0,
      taxAmount: Number(taxAmount.toFixed(2)),
      discountPercent: Number(discountPercent) || 0,
      discountAmount: Number(discountAmount.toFixed(2)),
      shipping: Number(shipping) || 0,
      total: Number(total.toFixed(2)),
      amountPaid: Number(amountPaid) || 0,
      balanceDue: Number(balanceDue.toFixed(2)),
      logo,
      customerData: form.customerData || {},
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });

    if (!res.ok) throw new Error("Failed to save invoice");

    const savedInvoice = await res.json();
    const invoiceCode = savedInvoice.code || `INV-${Date.now()}`;

    // ===== PDF Setup =====
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const gray = [90, 90, 90];
    const darkGray = [50, 50, 50];
    const lightGray = [230, 230, 230];
    const green = [0, 100, 0];
    const pageWidth = doc.internal.pageSize.getWidth();
    const formatNum = (num) =>
      `Rs. ${Number(num || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

    let y = 40;

    // ===== COMPANY LOGO & INFO (Left Side) =====
    try {
      if (company.logo) {
        const imgBlob = await fetch(company.logo).then((r) => r.blob());
        const imgBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imgBlob);
        });

        const imgX = 50;
        const imgY = y;
        const imgSize = 50;
        doc.addImage(imgBase64, "JPEG", imgX, imgY, imgSize, imgSize);

        // Text beside logo
        const textX = imgX + imgSize + 15;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...green);
        doc.text(company.name || "Company Name", textX, imgY + 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        if (company.address)
          doc.text(company.address, textX, imgY + 30);
        if (company.phone)
          doc.text(company.phone, textX, imgY + 45);
      } else {
        doc.setFontSize(18);
        doc.setTextColor(...green);
        doc.text(company.name || "Company Name", 50, y + 30);
      }
    } catch (e) {
      doc.setFontSize(18);
      doc.setTextColor(...green);
      doc.text(company.name || "Company Name", 50, y + 30);
    }

    // Line separator
    doc.setDrawColor(...lightGray);
    doc.line(50, 110, pageWidth - 50, 110);

    // ===== INVOICE TITLE =====
    doc.setFontSize(22);
    doc.setTextColor(...green);
    doc.text("INVOICE", 50, 150);

    doc.setFontSize(11);
    doc.setTextColor(...gray);
    doc.text(`Code: ${invoiceCode}`, 50, 168);

    // ===== BILL TO & SHIP TO =====
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text("Bill To:", 50, 200);
    doc.setTextColor(...darkGray);
    doc.text(doc.splitTextToSize(form.billTo || "-", 200), 50, 215);

    doc.setTextColor(...gray);
    doc.text("Ship To:", 300, 200);
    doc.setTextColor(...darkGray);
    doc.text(doc.splitTextToSize(form.shipTo || "-", 200), 300, 215);

    // ===== DETAILS (Right Side) =====
    let detailY = 200;
    const rightX = pageWidth - 200;
    const details = [
      ["Date:", form.date],
      ["Payment Terms:", form.paymentTerms || "-"],
      ["Due Date:", form.dueDate || "-"],
      ["PO Number:", form.poNumber || "-"],
    ];

    doc.setFontSize(10);
    details.forEach(([label, value]) => {
      doc.setTextColor(...gray);
      doc.text(label, rightX, detailY);
      doc.setTextColor(...darkGray);
      doc.text(value || "-", rightX + 90, detailY);
      detailY += 16;
    });

    // ===== ITEMS TABLE =====
    const tableBody = items.map((it) => [
      it.description || "-",
      it.qty,
      formatNum(it.rate),
      formatNum(it.amount),
    ]);

    autoTable(doc, {
      startY: 270,
      head: [["Item / Description", "Qty", "Rate", "Amount"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: gray,
        textColor: 255,
        halign: "center",
        fontStyle: "bold",
      },
      bodyStyles: { textColor: darkGray, halign: "left", valign: "middle" },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      margin: { left: 50, right: 50 },
      styles: { fontSize: 10, lineColor: lightGray },
    });

    // ===== SUMMARY =====
    const finalY = doc.lastAutoTable.finalY + 30;
    const rows = [
      ["Subtotal:", formatNum(subtotal)],
      [`Tax (${taxPercent}%):`, formatNum(taxAmount)],
      [`Discount (${discountPercent}%):`, `- ${formatNum(discountAmount)}`],
      ["Shipping:", formatNum(shipping)],
      ["Total:", formatNum(total)],
      ["Amount Paid:", formatNum(amountPaid)],
      ["Balance Due:", formatNum(balanceDue)],
    ];

    rows.forEach(([label, val], i) => {
      const y = finalY + i * 18;
      doc.setTextColor(...gray);
      doc.text(label, pageWidth - 220, y);
      doc.setTextColor(...(i >= 4 ? green : darkGray));
      doc.text(val, pageWidth - 60, y, { align: "right" });
    });

    // ===== NOTES & TERMS =====
    let noteY = finalY + rows.length * 18 + 30;
    doc.setDrawColor(...lightGray);
    doc.line(50, noteY - 10, pageWidth - 50, noteY - 10);

    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text("Notes:", 50, noteY);
    doc.setTextColor(...darkGray);
    doc.text(doc.splitTextToSize(form.notes || "-", 250), 50, noteY + 15);

    doc.text("Terms:", 330, noteY);
    doc.text(doc.splitTextToSize(form.terms || "-", 250), 330, noteY + 15);

    // ===== FOOTER =====
    doc.setDrawColor(...lightGray);
    doc.line(50, 810, pageWidth - 50, 810);
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text("Thank you for your business!", pageWidth / 2, 825, { align: "center" });

    // ===== SAVE PDF =====
    doc.save(`Invoice_${invoiceCode}.pdf`);
    toast.success(`✅ Invoice ${invoiceCode} generated successfully!`, { id: processingToast });

  } catch (err) {
    console.error("PDF generation error:", err);
    toast.error("❌ Error generating invoice", { id: processingToast });
  }
}




useEffect(() => {
  if (!loading && company) {
    setForm((p) => ({
      ...p,
      terms: company.terms || "",
    }));
  }
}, [company])






 

  return (
    <main className="flex bg-gray-50 min-h-screen">
  <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

  <div className="flex-1 w-full">
    <MobileHeader toggleSidebar={toggleSidebar} />

    <div className="p-4 md:p-6 lg:p-8 overflow-y-auto h-[100vh]">
      <div className="w-full">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Main Content Padding */}
          <div className="p-6 md:p-8 lg:p-12">

            {/* Header Section - Modern Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Company Info */}
              <div className="order-2 lg:order-1">
                {company ? (
                  <div className="flex items-start gap-5">
                    {/* Logo */}
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="h-20 w-20 rounded-xl object-cover shadow-md border border-gray-200"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-semibold text-lg border border-gray-300">
                        {company.name?.charAt(0).toUpperCase() || "C"}
                      </div>
                    )}

                    {/* Company Details */}
                    <div>
                      <h1 className="text-3xl max-md:text-xl font-bold text-[#003f20] mb-2">
                        {company.name || "Company Name"}
                      </h1>
                      <p className="text-gray-600 leading-relaxed">
                        {company.address || "Company Address"}
                        <br />
                        <span className="text-gray-500">Phone: {company.phone || "Company Phone"}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="h-6 w-6 border-3 border-[#003f20] border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-medium">Loading company info...</p>
                  </div>
                )}
              </div>

              {/* Invoice Title & Details */}
              <div className="order-1 lg:order-2 text-center lg:text-right">
                <h2 className="text-5xl max-md:text-2xl max-md:font-semibold bold text-[#003f20] tracking-tight mb-8">
                  INVOICE
                </h2>

                <div className="space-y-4 text-sm bg-gray-50 p-6 rounded-2xl inline-block lg:block">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 font-medium mb-1">Invoice Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => updateForm("date", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-1">Due Date</label>
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => updateForm("dueDate", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 font-medium mb-1">Payment Terms</label>
                      <input
                        value={form.paymentTerms}
                        onChange={(e) => updateForm("paymentTerms", e.target.value)}
                        placeholder="e.g. Net 30"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-1">PO Number</label>
                      <input
                        type="text"
                        value={form.poNumber}
                        onChange={(e) => updateForm("poNumber", e.target.value)}
                        placeholder="Purchase Order #"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="relative">
                <label className="block text-lg font-semibold text-gray-800 mb-3">Bill To</label>
                <textarea
                  rows="5"
                  value={form.billTo}
                  onChange={(e) => handleCustomerInput(e.target.value)}
                  placeholder="Customer Name&#10;Address Line 1&#10;Address Line 2&#10;Phone & Email"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-[#005f33] resize-none text-gray-700"
                />

                {/* Customer Suggestions */}
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <ul className="absolute z-30 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {customerSuggestions.map((c) => (
                      <li
                        key={c._id}
                        onClick={() => handleSelectCustomer(c)}
                        className="px-5 py-3 hover:bg-green-50 cursor-pointer flex justify-between items-center border-b last:border-b-0"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-gray-500">{c.phone}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Ship To <span className="text-gray-500 font-normal text-sm">(optional)</span></label>
                <textarea
                  rows="5"
                  value={form.shipTo}
                  onChange={(e) => updateForm("shipTo", e.target.value)}
                  placeholder="Shipping Address (if different)"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-[#005f33] resize-none text-gray-700"
                />
              </div>
            </div>

            {/* Items Table - Enhanced Design */}
            <div className="mb-10">
  {/* Section Header */}
  <div className="bg-gradient-to-r from-[#003f20] to-[#005f33] text-white rounded-t-2xl px-6 py-4">
    <h3 className="text-xl font-bold">Items</h3>
  </div>

  <div className="border-2 border-t-0 border-gray-200 rounded-b-2xl overflow-hidden">
    <div className="overflow-x-auto min-h-60">
      {/* Desktop Table View */}
      <table className="w-full hidden md:table">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-6 py-4 font-semibold text-gray-700">Description</th>
            <th className="text-center px-6 py-4 font-semibold text-gray-700 w-28">Qty</th>
            <th className="text-center px-6 py-4 font-semibold text-gray-700 w-32">Rate</th>
            <th className="text-right px-6 py-4 font-semibold text-gray-700 w-32">Amount</th>
            <th className="w-12 px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y  divide-gray-200">
          {items.map((it) => (
            <tr key={it.id}>
              <td className="px-6 py-5 relative">
                <div className="relative">
                  <input
                    value={it.description}
                    onChange={(e) => handleDescriptionInput(it.id, e.target.value)}
                    placeholder="Item description..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005f33] focus:border-transparent"
                  />
                  {/* Desktop Suggestions */}
                  {showSuggestions[it.id] && searchSuggestions[it.id]?.length > 0 && (
                    <ul className="absolute z-30 left-6 right-6 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {searchSuggestions[it.id].map((product) => (
                        <li
                          key={product._id}
                          onClick={() => handleSelectSuggestion(it.id, product)}
                          className="px-5 py-3 hover:bg-green-50 cursor-pointer flex justify-between border-b last:border-b-0"
                        >
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm text-gray-500">Rs. {product.purchasePrice}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => updateItem(it.id, "qty", e.target.value)}
                  className="w-24 px-4 py-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#005f33]"
                />
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-600">Rs.</span>
                  <input
                    type="number"
                    value={it.rate}
                    onChange={(e) => updateItem(it.id, "rate", e.target.value)}
                    className="w-32 px-4 py-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#005f33]"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-right font-semibold text-gray-800">
                Rs. {Number(it.amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-4 text-center">
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {items.map((it, index) => (
          <div key={it.id} className="p-6 space-y-5 relative bg-white">
            {/* Item Header */}
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-gray-800">Item {index + 1}</h4>
              <button
                onClick={() => removeItem(it.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <Trash2 size={22} />
              </button>
            </div>

            {/* Description with Suggestions */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
              <input
                value={it.description}
                onChange={(e) => handleDescriptionInput(it.id, e.target.value)}
                placeholder="Item or service description..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005f33] focus:border-transparent text-base"
              />
              {/* Mobile Suggestions Dropdown */}
              {showSuggestions[it.id] && searchSuggestions[it.id]?.length > 0 && (
                <ul className="absolute z-40 left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                  {searchSuggestions[it.id].map((product) => (
                    <li
                      key={product._id}
                      onClick={() => handleSelectSuggestion(it.id, product)}
                      className="px-5 py-4 hover:bg-green-50 cursor-pointer flex justify-between items-center border-b last:border-b-0"
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-gray-500">Rs. {product.purchasePrice}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Qty & Rate Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Quantity</label>
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => updateItem(it.id, "qty", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center focus:ring-2 focus:ring-[#005f33] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Rate (Rs.)</label>
                <input
                  type="number"
                  value={it.rate}
                  onChange={(e) => updateItem(it.id, "rate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center focus:ring-2 focus:ring-[#005f33] text-base"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Amount</span>
              <span className="text-xl font-bold text-[#003f20]">
                Rs. {Number(it.amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Add Item Button - Same on both */}
    <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
      <button
        onClick={addItem}
        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#003f20] text-white font-semibold rounded-xl hover:bg-[#005f33] transition shadow-lg text-lg"
      >
        <Plus size={22} />
        Add New Item
      </button>
    </div>
  </div>
</div>

            {/* Notes, Terms & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Notes & Terms */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Notes</label>
                  <textarea
                    rows="4"
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                    placeholder="Any additional notes for the customer..."
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-[#005f33] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Terms & Conditions</label>
                  <textarea
                    rows="4"
                    value={form.terms}
                    onChange={(e) => updateForm("terms", e.target.value)}
                    placeholder="Payment terms, late fees, return policy..."
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-[#005f33] resize-none"
                  />
                </div>
              </div>

              {/* Summary Box - Highlighted */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#003f20] to-[#005f33] text-white p-8 rounded-3xl shadow-xl">
                  <h3 className="text-2xl font-bold mb-6">Invoice Summary</h3>

                  <div className="space-y-4 text-lg">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        Rs. {Number(subtotal).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-3">
                      <label className="text-white/90">Tax (%)</label>
                      <input
                        type="number"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(e.target.value)}
                        className="w-20 px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white placeholder-white/60 text-center"
                      />
                    </div>

                    <div className="flex justify-between items-center gap-3">
                      <label className="text-white/90">Discount (%)</label>
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className="w-20 px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white placeholder-white/60 text-center"
                      />
                    </div>

                    <div className="flex justify-between items-center gap-3">
                      <label className="text-white/90">Shipping</label>
                      <input
                        type="number"
                        value={shipping}
                        onChange={(e) => setShipping(e.target.value)}
                        className="w-24 px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-center"
                      />
                    </div>

                    <div className="border-t border-white/30 pt-5 mt-6">
                      <div className="flex justify-between text-xl font-semibold">
                        <span>Total</span>
                        <span>Rs. {Number(total).toLocaleString("en-PK", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-center mt-5 gap-3">
                        <label className="text-white/90">Paid</label>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="w-28 px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-center"
                        />
                      </div>

                      <div className="flex justify-between text-2xl font-semibold mt-6 pt-5 border-t border-white/30">
                        <span>Balance Due</span>
                        <span>Rs. {Number(balanceDue).toLocaleString("en-PK", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadPDF}
                      className="mt-8 w-full py-4 bg-white text-[#003f20]  rounded-xl hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-3 text-lg"
                    >
                      <Download size={24} />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</main>

  );
}
