import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  description: String,
  qty: Number,
  rate: Number,
  amount: Number,
});

const InvoiceSchema = new mongoose.Schema(
  {
    billTo: { type: String },
    shipTo: { type: String },
    date: { type: String },
    paymentTerms: { type: String },
    dueDate: { type: String },
    poNumber: { type: String },

    // Items List
    items: [ItemSchema],

    // Financials
    subtotal: { type: Number },
    taxPercent: { type: Number },
    taxAmount: { type: Number },
    discountPercent: { type: Number },
    discountAmount: { type: Number },
    shipping: { type: Number },
    total: { type: Number },
    amountPaid: { type: Number },
    balanceDue: { type: Number },

    // Extra Info
    notes: { type: String },
    terms: { type: String },

    // Optional
    logo: { type: String },
    status: { type: String, default: "Pending" },

    // Unique code
    code: { type: String, unique: true },

    // Invoice number (same as code)
    invoiceNo: { type: String, unique: true },
  },
  { timestamps: true }
);




// Prevent overwrite error
const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
export default Invoice;
