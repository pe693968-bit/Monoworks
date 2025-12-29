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

  <div className="flex-1 w-full ">
    <MobileHeader toggleSidebar={toggleSidebar} />

    <div className="p-4 overflow-scroll h-[100vh] ">
      {/* --- Main Container --- */}
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-full mx-auto bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            {company ? (
  <div className="flex items-center gap-4 border-b pb-4">
    {/* 🔹 Company Logo */}
    {company.logo ? (
      <img
        src={company.logo}
        alt={company.name}
        className="h-14 w-14 rounded-md object-cover shadow-sm border"
      />
    ) : (
      <div className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs border">
        Logo
      </div>
    )}

    {/* 🔹 Company Details */}
    <div>
      <h1 className="text-2xl font-semibold text-[#003f20] leading-tight">
        {company.name || "Company Name"}
      </h1>
      <p className="text-sm text-gray-600 leading-snug">
        {company.address || "Company Address"} <br />
        <span className="text-gray-500">{company.phone || "Company Phone"}</span>
      </p>
    </div>
  </div>
) : (
  <div className="flex items-center gap-2 text-gray-500 border-b pb-4">
    <div className="h-5 w-5 border-2 border-[#003f20] border-t-transparent rounded-full animate-spin"></div>
    <p>Loading company info...</p>
  </div>
)}


            <div className="text-right">
              <h2 className="text-3xl font-bold text-[#003f20] tracking-wide">
                INVOICE
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                
               <div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Date</label>
  <input
    type="date"
    value={form.date}
    onChange={(e) => updateForm("date", e.target.value)}
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>
<div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Payment Terms</label>
  <input
    value={form.paymentTerms}
    onChange={(e) => updateForm("paymentTerms", e.target.value)}
    placeholder="Net 7 / Net 30"
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>

<div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Phone Number</label>
  <input
    type="text"
    value={form.poNumber}
    onChange={(e) => updateForm("poNumber", e.target.value)}
    placeholder="Phone Number"
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>

                
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="relative">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Bill To
  </label>
  <textarea
    value={form.billTo}
    onChange={(e) => handleCustomerInput(e.target.value)}
    placeholder="Client Name, Address, Phone..."
    className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#005f33] resize-none"
  />

  {/* ✅ Suggestions Dropdown */}
  {showCustomerSuggestions && customerSuggestions.length > 0 && (
    <ul className="absolute z-10 bg-white border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto w-full">
      {customerSuggestions.map((c) => (
        <li
          key={c._id}
          onClick={() => handleSelectCustomer(c)}
          className="p-2 hover:bg-green-50 cursor-pointer flex justify-between"
        >
          <span>{c.name}</span>
          <span className="text-gray-500 text-sm">{c.phone}</span>
        </li>
      ))}
    </ul>
  )}
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ship To (optional)
              </label>
              <textarea
                value={form.shipTo}
                onChange={(e) => updateForm("shipTo", e.target.value)}
                placeholder="(optional)"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#005f33] resize-none"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
  <div className="bg-[#003f20] text-white rounded-t-md p-3 grid grid-cols-12 gap-2 text-sm font-semibold">
    <div className="col-span-7">Item</div>
    <div className="col-span-2 text-center">Qty</div>
    <div className="col-span-2 text-center">Rate</div>
    <div className="col-span-1 text-right">Amount</div>
  </div>

   <div className="border border-t-0 rounded-b-md p-4 space-y-3 bg-white relative">
      {items.map((it) => (
        <div key={it.id} className="grid grid-cols-12 gap-2 items-start border-b pb-2 relative">
          {/* 🟢 ITEM INPUT WITH SUGGESTIONS */}
          <div className="col-span-7 relative">
            <input
              value={it.description}
              onChange={(e) => handleDescriptionInput(it.id, e.target.value)}
              placeholder="Item or service description..."
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#005f33]"
            />

            {/* ✅ Suggestions Dropdown */}
            {showSuggestions[it.id] && searchSuggestions[it.id]?.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto w-full">
                {searchSuggestions[it.id].map((product) => (
                  <li
                    key={product._id}
                    onClick={() => handleSelectSuggestion(it.id, product)}
                    className="p-2 hover:bg-green-50 cursor-pointer flex justify-between"
                  >
                    <span>{product.name}</span>
                    <span className="text-gray-500 text-sm">Rs. {product.purchasePrice}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 🟢 QUANTITY */}
          <div className="col-span-2">
            <input
              type="number"
              value={it.qty}
              onChange={(e) => updateItem(it.id, "qty", e.target.value)}
              className="w-full p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
            />
          </div>

          {/* 🟢 RATE */}
          <div className="col-span-2 flex items-center gap-1">
            <span className="text-sm text-gray-600">Rs.</span>
            <input
              type="number"
              value={it.rate}
              onChange={(e) => updateItem(it.id, "rate", e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#005f33]"
            />
          </div>

          {/* 🟢 AMOUNT & DELETE */}
          <div className="col-span-1 text-right">
            <span className="font-medium text-gray-700">
              Rs.{" "}
              {Number(it.amount || 0).toLocaleString("en-PK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <button
              onClick={() => removeItem(it.id)}
              className="ml-2 text-red-500 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addItem}
        className="mt-3 inline-flex items-center gap-2 border border-green-500 text-green-700 hover:bg-green-50 px-3 py-2 rounded-md transition"
      >
        <Plus size={14} /> Add Item
      </button>
    </div>
</div>


          {/* Notes + Summary */}
          <div className="mt-8 grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Add any relevant notes..."
                  className="w-full h-24 p-3 border rounded-md focus:ring-1 focus:ring-[#005f33] resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Terms
                </label>
                <textarea
                  value={form.terms}
                  onChange={(e) => updateForm("terms", e.target.value)}
                  placeholder="Add payment or delivery terms..."
                  className="w-full h-24 p-3 border rounded-md focus:ring-1 focus:ring-[#005f33] resize-none"
                />
              </div>
            </div>

            {/* Summary */}
            {/* Summary */}
<div className="col-span-5 bg-gray-50 p-5 rounded-lg border border-gray-100">
  <div className="space-y-3 text-sm">
    <div className="flex justify-between">
      <span>Subtotal</span>
      <span className="font-medium">
        Rs. {Number(subtotal).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <label>Tax (%)</label>
      <input
        type="number"
        value={taxPercent}
        onChange={(e) => setTaxPercent(e.target.value)}
        className="w-24 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
      />
    </div>

    <div className="flex justify-between items-center">
      <label>Discount (%)</label>
      <input
        type="number"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
        className="w-24 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
      />
    </div>

    <div className="flex justify-between items-center">
      <label>Shipping (Rs)</label>
      <input
        type="number"
        value={shipping}
        onChange={(e) => setShipping(e.target.value)}
        className="w-28 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
      />
    </div>

    <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
      <div className="flex justify-between font-semibold text-gray-700">
        <span>Total</span>
        <span>
          Rs. {Number(total).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <label>Amount Paid</label>
        <input
          type="number"
          min={0}
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="w-28 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
        />
      </div>

      <div className="flex justify-between font-semibold text-gray-800">
  <span>Balance Due</span>
  <span>
    Rs.{" "}
    {Number(balanceDue).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
    })}
  </span>
</div>
<div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Due Date</label>
  <input
    type="date"
    value={form.dueDate}
    onChange={(e) => updateForm("dueDate", e.target.value)}
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>


      <button
        onClick={handleDownloadPDF}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-[#003f20] text-white py-2 rounded-md hover:bg-[#005f33] transition"
      >
        <Download size={16} /> Download PDF
      </button>
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
