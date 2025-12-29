"use client";
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Plus, Trash2, Download } from "lucide-react";

export default function InvoicePage() {
  const [logo, setLogo] = useState(null);
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
  });

  const [items, setItems] = useState([
    { id: Date.now(), description: "", qty: 1, rate: 0, amount: 0 },
  ]);

  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shipping, setShipping] = useState(0);

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

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

  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const taxAmount = +(subtotal * (Number(taxPercent) || 0) / 100).toFixed(2);
  const discountAmount = +(subtotal * (Number(discountPercent) || 0) / 100).toFixed(2);
  const total = +(subtotal + taxAmount - discountAmount + Number(shipping || 0)).toFixed(2);

  function handleDownloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 63, 32);
    doc.text("INVOICE", 430, 40);

    // Logo
    if (logo) {
      try {
        doc.addImage(logo, "JPEG", 40, 20, 120, 60);
      } catch (e) {
        // some browsers produce PNG data URLs; let auto detect
        try {
          doc.addImage(logo, 40, 20, 120, 60);
        } catch (err) {
          console.warn("Logo not added to PDF:", err);
        }
      }
    } else {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Add your logo", 60, 50);
    }

    // From / Bill To / Ship To
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("From:", 40, 110);
    doc.text(doc.splitTextToSize(form.from || "-", 220), 40, 125);

    doc.text("Bill To:", 300, 110);
    doc.text(doc.splitTextToSize(form.billTo || "-", 220), 300, 125);

    doc.text("Ship To:", 300, 170);
    doc.text(doc.splitTextToSize(form.shipTo || "-", 220), 300, 185);

    // Right side small fields
    doc.setFontSize(10);
    const rightX = 430;
    doc.text(`Invoice #: ${form.invoiceNo}`, rightX, 80);
    doc.text(`Date: ${form.date}`, rightX, 95);
    doc.text(`Payment Terms: ${form.paymentTerms || "-"}`, rightX, 110);
    doc.text(`Due Date: ${form.dueDate || "-"}`, rightX, 125);
    doc.text(`PO Number: ${form.poNumber || "-"}`, rightX, 140);

    // Items table
    const tableBody = items.map((it) => [it.description || "-", it.qty, `Rs. ${Number(it.rate || 0).toFixed(2)}`, `Rs. ${Number(it.amount || 0).toFixed(2)}`]);

    autoTable(doc, {
      startY: 220,
      head: [["Item / Description", "Quantity", "Rate", "Amount"]],
      body: tableBody,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 63, 32] },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 300;

    // Totals box
    doc.setFontSize(11);
    doc.setTextColor(80);
    const txX = 400;
    let y = finalY + 20;
    doc.text(`Subtotal:`, txX, y);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 15;
    doc.text(`Tax (${taxPercent}%):`, txX, y);
    doc.text(`Rs. ${taxAmount.toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 15;
    doc.text(`Discount (${discountPercent}%):`, txX, y);
    doc.text(`- Rs. ${discountAmount.toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 15;
    doc.text(`Shipping:`, txX, y);
    doc.text(`Rs. ${Number(shipping || 0).toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 18;
    doc.setFontSize(13);
    doc.setTextColor(0, 63, 32);
    doc.text(`Total:`, txX, y);
    doc.text(`Rs. ${total.toFixed(2)}`, txX + 120, y, { align: "right" });

    // Notes & Terms
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Notes:", 40, y + 40);
    doc.text(doc.splitTextToSize(form.notes || "-", 260), 40, y + 55);

    doc.text("Terms:", 40, y + 120);
    doc.text(doc.splitTextToSize(form.terms || "-", 260), 40, y + 135);

    doc.save(`${form.invoiceNo || "invoice"}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" className="object-contain w-full h-full" />
              ) : (
                <button
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="text-sm text-gray-400"
                >
                  + Add Your Logo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div>
              <input value={form.from} onChange={(e) => updateForm("from", e.target.value)} placeholder="Who is this from?" className="w-[420px] p-3 border border-gray-200 rounded-md" />
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold text-[#003f20]">INVOICE</h2>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">#</label>
                <input value={form.invoiceNo} onChange={(e) => updateForm("invoiceNo", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">Date</label>
                <input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">Payment Terms</label>
                <input value={form.paymentTerms} onChange={(e) => updateForm("paymentTerms", e.target.value)} placeholder="Net 7 / Net 30" className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => updateForm("dueDate", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">PO Number</label>
                <input value={form.poNumber} onChange={(e) => updateForm("poNumber", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600">Bill To</label>
            <textarea value={form.billTo} onChange={(e) => updateForm("billTo", e.target.value)} className="w-full p-3 border border-gray-200 rounded-md" placeholder="Who is this to?" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Ship To (optional)</label>
            <textarea value={form.shipTo} onChange={(e) => updateForm("shipTo", e.target.value)} className="w-full p-3 border border-gray-200 rounded-md" placeholder="(optional)" />
          </div>
        </div>

        {/* Items table */}
        <div className="mt-6">
          <div className="bg-[#003f20] text-white rounded-t-md p-3 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-7 text-sm font-semibold">Item</div>
            <div className="col-span-2 text-center text-sm font-semibold">Quantity</div>
            <div className="col-span-2 text-center text-sm font-semibold">Rate</div>
            <div className="col-span-1 text-right text-sm font-semibold">Amount</div>
          </div>

          <div className="border border-t-0 border-gray-100 rounded-b-md p-4 space-y-3">
            {items.map((it, idx) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <input value={it.description} onChange={(e) => updateItem(it.id, "description", e.target.value)} placeholder="Description of item/service..." className="w-full p-2 border border-gray-200 rounded-md" />
                </div>
                <div className="col-span-2">
                  <input type="number" min={0} value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-center" />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Rs.</span>
                    <input type="number" min={0} value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} className="w-full p-2 border border-gray-200 rounded-md" />
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="text-sm font-semibold">Rs. {Number(it.amount || 0).toFixed(2)}</div>
                  <button onClick={() => removeItem(it.id)} className="mt-1 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button onClick={addItem} className="inline-flex items-center gap-2 border border-green-400 text-green-600 px-3 py-2 rounded-md">
                <Plus size={14} /> Line Item
              </button>
            </div>
          </div>
        </div>

        {/* Notes / Totals */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-7 space-y-4">
            <div>
              <label className="text-sm text-gray-600">Notes</label>
              <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Notes - any relevant information not already covered" className="w-full p-3 border border-gray-200 rounded-md h-28" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Terms</label>
              <textarea value={form.terms} onChange={(e) => updateForm("terms", e.target.value)} placeholder="Terms and conditions - late fees, payment methods, delivery schedule" className="w-full p-3 border border-gray-200 rounded-md h-28" />
            </div>
          </div>

          <div className="col-span-5 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="font-semibold">Rs. {subtotal.toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm text-gray-600">Tax</label>
              <input type="number" min={0} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className="p-2 border border-gray-200 rounded-md w-24" />
              <span className="text-sm">%</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm text-gray-600">Discount</label>
              <input type="number" min={0} value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="p-2 border border-gray-200 rounded-md w-24" />
              <span className="text-sm">%</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm text-gray-600">Shipping</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Rs.</span>
                <input type="number" min={0} value={shipping} onChange={(e) => setShipping(e.target.value)} className="p-2 border border-gray-200 rounded-md w-28" />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-semibold text-lg">Rs. {total.toFixed(2)}</div>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-sm text-gray-600">Amount Paid</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rs.</span>
                  <input type="number" min={0} defaultValue={0} className="p-2 border border-gray-200 rounded-md w-28" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Balance Due</div>
                <div className="font-semibold">Rs. {total.toFixed(2)}</div>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-md hover:bg-[#005f33]">
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Plus, Trash2, Download } from "lucide-react";

export default function InvoicePage() {
  const [logo, setLogo] = useState(null);
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
  });

  const [items, setItems] = useState([
    { id: Date.now(), description: "", qty: 1, rate: 0, amount: 0 },
  ]);

  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shipping, setShipping] = useState(0);

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

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

  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const taxAmount = +(subtotal * (Number(taxPercent) || 0) / 100).toFixed(2);
  const discountAmount = +(subtotal * (Number(discountPercent) || 0) / 100).toFixed(2);
  const total = +(subtotal + taxAmount - discountAmount + Number(shipping || 0)).toFixed(2);

  function handleDownloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 63, 32);
    doc.text("INVOICE", 430, 40);

    // Logo
    if (logo) {
      try {
        doc.addImage(logo, "JPEG", 40, 20, 120, 60);
      } catch (e) {
        // some browsers produce PNG data URLs; let auto detect
        try {
          doc.addImage(logo, 40, 20, 120, 60);
        } catch (err) {
          console.warn("Logo not added to PDF:", err);
        }
      }
    } else {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Add your logo", 60, 50);
    }

    // From / Bill To / Ship To
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("From:", 40, 110);
    doc.text(doc.splitTextToSize(form.from || "-", 220), 40, 125);

    doc.text("Bill To:", 300, 110);
    doc.text(doc.splitTextToSize(form.billTo || "-", 220), 300, 125);

    doc.text("Ship To:", 300, 170);
    doc.text(doc.splitTextToSize(form.shipTo || "-", 220), 300, 185);

    // Right side small fields
    doc.setFontSize(10);
    const rightX = 430;
    doc.text(`Invoice #: ${form.invoiceNo}`, rightX, 80);
    doc.text(`Date: ${form.date}`, rightX, 95);
    doc.text(`Payment Terms: ${form.paymentTerms || "-"}`, rightX, 110);
    doc.text(`Due Date: ${form.dueDate || "-"}`, rightX, 125);
    doc.text(`PO Number: ${form.poNumber || "-"}`, rightX, 140);

    // Items table
    const tableBody = items.map((it) => [it.description || "-", it.qty, `Rs. ${Number(it.rate || 0).toFixed(2)}`, `Rs. ${Number(it.amount || 0).toFixed(2)}`]);

    autoTable(doc, {
      startY: 220,
      head: [["Item / Description", "Quantity", "Rate", "Amount"]],
      body: tableBody,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 63, 32] },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 300;

    // Totals box
    doc.setFontSize(11);
    doc.setTextColor(80);
    const txX = 400;
    let y = finalY + 20;
    doc.text(`Subtotal:`, txX, y);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 15;
    doc.text(`Tax (${taxPercent}%):`, txX, y);
    doc.text(`Rs. ${taxAmount.toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 15;
    doc.text(`Discount (${discountPercent}%):`, txX, y);
    doc.text(`- Rs. ${discountAmount.toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 15;
    doc.text(`Shipping:`, txX, y);
    doc.text(`Rs. ${Number(shipping || 0).toFixed(2)}`, txX + 120, y, { align: "right" });
    y += 18;
    doc.setFontSize(13);
    doc.setTextColor(0, 63, 32);
    doc.text(`Total:`, txX, y);
    doc.text(`Rs. ${total.toFixed(2)}`, txX + 120, y, { align: "right" });

    // Notes & Terms
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Notes:", 40, y + 40);
    doc.text(doc.splitTextToSize(form.notes || "-", 260), 40, y + 55);

    doc.text("Terms:", 40, y + 120);
    doc.text(doc.splitTextToSize(form.terms || "-", 260), 40, y + 135);

    doc.save(`${form.invoiceNo || "invoice"}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" className="object-contain w-full h-full" />
              ) : (
                <button
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="text-sm text-gray-400"
                >
                  + Add Your Logo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div>
              <input value={form.from} onChange={(e) => updateForm("from", e.target.value)} placeholder="Who is this from?" className="w-[420px] p-3 border border-gray-200 rounded-md" />
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold text-[#003f20]">INVOICE</h2>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">#</label>
                <input value={form.invoiceNo} onChange={(e) => updateForm("invoiceNo", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">Date</label>
                <input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">Payment Terms</label>
                <input value={form.paymentTerms} onChange={(e) => updateForm("paymentTerms", e.target.value)} placeholder="Net 7 / Net 30" className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => updateForm("dueDate", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm text-gray-600">PO Number</label>
                <input value={form.poNumber} onChange={(e) => updateForm("poNumber", e.target.value)} className="p-2 border border-gray-200 rounded-md w-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600">Bill To</label>
            <textarea value={form.billTo} onChange={(e) => updateForm("billTo", e.target.value)} className="w-full p-3 border border-gray-200 rounded-md" placeholder="Who is this to?" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Ship To (optional)</label>
            <textarea value={form.shipTo} onChange={(e) => updateForm("shipTo", e.target.value)} className="w-full p-3 border border-gray-200 rounded-md" placeholder="(optional)" />
          </div>
        </div>

        {/* Items table */}
        <div className="mt-6">
          <div className="bg-[#003f20] text-white rounded-t-md p-3 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-7 text-sm font-semibold">Item</div>
            <div className="col-span-2 text-center text-sm font-semibold">Quantity</div>
            <div className="col-span-2 text-center text-sm font-semibold">Rate</div>
            <div className="col-span-1 text-right text-sm font-semibold">Amount</div>
          </div>

          <div className="border border-t-0 border-gray-100 rounded-b-md p-4 space-y-3">
            {items.map((it, idx) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <input value={it.description} onChange={(e) => updateItem(it.id, "description", e.target.value)} placeholder="Description of item/service..." className="w-full p-2 border border-gray-200 rounded-md" />
                </div>
                <div className="col-span-2">
                  <input type="number" min={0} value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-center" />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Rs.</span>
                    <input type="number" min={0} value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} className="w-full p-2 border border-gray-200 rounded-md" />
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="text-sm font-semibold">Rs. {Number(it.amount || 0).toFixed(2)}</div>
                  <button onClick={() => removeItem(it.id)} className="mt-1 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button onClick={addItem} className="inline-flex items-center gap-2 border border-green-400 text-green-600 px-3 py-2 rounded-md">
                <Plus size={14} /> Line Item
              </button>
            </div>
          </div>
        </div>

        {/* Notes / Totals */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-7 space-y-4">
            <div>
              <label className="text-sm text-gray-600">Notes</label>
              <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Notes - any relevant information not already covered" className="w-full p-3 border border-gray-200 rounded-md h-28" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Terms</label>
              <textarea value={form.terms} onChange={(e) => updateForm("terms", e.target.value)} placeholder="Terms and conditions - late fees, payment methods, delivery schedule" className="w-full p-3 border border-gray-200 rounded-md h-28" />
            </div>
          </div>

          <div className="col-span-5 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="font-semibold">Rs. {subtotal.toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm text-gray-600">Tax</label>
              <input type="number" min={0} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className="p-2 border border-gray-200 rounded-md w-24" />
              <span className="text-sm">%</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm text-gray-600">Discount</label>
              <input type="number" min={0} value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="p-2 border border-gray-200 rounded-md w-24" />
              <span className="text-sm">%</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm text-gray-600">Shipping</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Rs.</span>
                <input type="number" min={0} value={shipping} onChange={(e) => setShipping(e.target.value)} className="p-2 border border-gray-200 rounded-md w-28" />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-semibold text-lg">Rs. {total.toFixed(2)}</div>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-sm text-gray-600">Amount Paid</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rs.</span>
                  <input type="number" min={0} defaultValue={0} className="p-2 border border-gray-200 rounded-md w-28" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Balance Due</div>
                <div className="font-semibold">Rs. {total.toFixed(2)}</div>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-md hover:bg-[#005f33]">
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
