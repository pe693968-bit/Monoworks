"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import MobileHeader from "@/app/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCompany } from "@/app/context/CompanyContext";

export default function SalePage() {
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  const {company} = useCompany();
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  async function fetchInvoice() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoice!");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      toast.success("Invoice deleted successfully!");
      router.push("/sales");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete invoice!");
    }
  };

const handlePrintInvoice = async () => {
  if (!invoice || !company) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const gray = [90, 90, 90];
  const darkGray = [50, 50, 50];
  const lightGray = [230, 230, 230];
  const green = [0, 100, 0];
  const pageWidth = doc.internal.pageSize.getWidth();
  const formatNum = (num) =>
    `Rs. ${Number(num || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  let y = 40;

  // ===== COMPANY LOGO & INFO =====
  try {
    if (company.logo) {
      const imgBlob = await fetch(company.logo).then((r) => r.blob());
      const imgBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(imgBlob);
      });

      // Left side profile-style logo
      const imgX = 50;
      const imgY = y;
      const imgSize = 50;
      doc.addImage(imgBase64, "JPEG", imgX, imgY, imgSize, imgSize);

      // Text beside logo
      const textX = imgX + imgSize + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 80, 0);
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
  doc.text(`Code: ${invoice.code}`, 50, 168);

  // ===== BILL TO & SHIP TO =====
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text("Bill To:", 50, 200);
  doc.setTextColor(...darkGray);
  doc.text(doc.splitTextToSize(invoice.billTo || "-", 200), 50, 215);

  doc.setTextColor(...gray);
  doc.text("Ship To:", 300, 200);
  doc.setTextColor(...darkGray);
  doc.text(doc.splitTextToSize(invoice.shipTo || "-", 200), 300, 215);

  // ===== DETAILS (Right side) =====
  let detailY = 200;
  const rightX = pageWidth - 200;
  const details = [
    ["Date:", invoice.date],
    ["Payment Terms:", invoice.paymentTerms || "-"],
    ["PO Number:", invoice.poNumber || "-"],
    ["Status:", invoice.status || "-"],
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
  const tableBody = invoice.items.map(it => [
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
    headStyles: { fillColor: gray, textColor: 255, halign: "center", fontStyle: "bold" },
    bodyStyles: { textColor: darkGray, halign: "left", valign: "middle" },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
    margin: { left: 50, right: 50 },
    styles: { fontSize: 10, lineColor: lightGray },
  });

  // ===== SUMMARY =====
  const finalY = doc.lastAutoTable.finalY + 30;
  const rows = [
    ["Subtotal:", formatNum(invoice.subtotal)],
    [`Tax (${invoice.taxPercent}%):`, formatNum(invoice.taxAmount)],
    [`Discount (${invoice.discountPercent}%):`, `- ${formatNum(invoice.discountAmount)}`],
    ["Shipping:", formatNum(invoice.shipping)],
    ["Total:", formatNum(invoice.total)],
    ["Amount Paid:", formatNum(invoice.amountPaid)],
    ["Balance Due:", formatNum(invoice.balanceDue)],
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
  doc.text(doc.splitTextToSize(invoice.notes || "-", 250), 50, noteY + 15);

  doc.text("Terms:", 330, noteY);
  doc.text(doc.splitTextToSize(invoice.terms || "-", 250), 330, noteY + 15);

  // ===== FOOTER =====
  doc.setDrawColor(...lightGray);
  doc.line(50, 810, pageWidth - 50, 810);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text("Thank you for your business!", pageWidth / 2, 825, { align: "center" });

  doc.save(`Invoice_${invoice.code}.pdf`);
};





  return (
   <main className="flex bg-gray-100 min-h-screen">
  {/* Sidebar hamesha visible */}
  <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

  <div className="flex-1 w-full overflow-y-scroll h-screen relative">
    {/* Mobile Header hamesha visible */}
    <MobileHeader toggleSidebar={toggleSidebar} />

    {loading ? (
      // Loading overlay for content
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#003f20]"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    ) : (
      // Actual content
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[#003f20]">{invoice?.code}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md border">
          <div>
            <h3 className="font-semibold text-gray-700">Bill To</h3>
            <p className="text-gray-600">{invoice?.billTo}</p>
            <p className="text-gray-500 mt-1">Date: {invoice?.date}</p>
            <p className="text-gray-500 mt-1">PO Number: {invoice?.poNumber || "-"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Ship To</h3>
            <p className="text-gray-600">{invoice?.shipTo}</p>
            <p className="text-gray-500 mt-1">Payment Terms: {invoice?.paymentTerms || "-"}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-[#003f20] text-white">
              <tr>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right">Rate</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="p-4">{item.description}</td>
                  <td className="p-4 text-center">{item.qty}</td>
                  <td className="p-4 text-right">Rs. {item.rate}</td>
                  <td className="p-4 text-right">Rs. {item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md border">
          <div className="space-y-2">
            <p><strong>Notes:</strong> {invoice?.notes || "-"}</p>
            <p><strong>Terms:</strong> {invoice?.terms || "-"}</p>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex justify-between"><span>Subtotal:</span> <span>Rs. {invoice?.subtotal}</span></div>
            <div className="flex justify-between"><span>Tax ({invoice?.taxPercent}%):</span> <span>Rs. {invoice?.taxAmount}</span></div>
            <div className="flex justify-between"><span>Discount ({invoice?.discountPercent}%):</span> <span>- Rs. {invoice?.discountAmount}</span></div>
            <div className="flex justify-between"><span>Shipping:</span> <span>Rs. {invoice?.shipping}</span></div>
            <div className="flex justify-between font-semibold text-lg text-[#003f20] border-t pt-2">
              <span>Total:</span> <span>Rs. {invoice?.total}</span>
            </div>
            <div className="flex justify-between text-green-600"><span>Amount Paid:</span> <span>Rs. {invoice?.amountPaid}</span></div>
            <div className="flex justify-between text-red-600 font-semibold"><span>Balance Due:</span> <span>Rs. {invoice?.balanceDue}</span></div>
          </div>
        </div>

        {/* Actions */}
        {/* Actions */}
<div className="flex justify-end gap-4 mt-6">
  <Button className="bg-[#003f20] text-white" onClick={handlePrintInvoice}>
    <Printer size={16} /> Download PDF
  </Button>

  {/* Show Delete only for admin */}
  {role === "admin" && (
    <Button className="bg-red-600 text-white" onClick={handleDelete}>
      <Trash2 size={16} /> Delete
    </Button>
  )}
</div>

      </div>
    )}
  </div>
</main>

  );
}
