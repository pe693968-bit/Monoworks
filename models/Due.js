// models/Due.js
import mongoose from "mongoose";

const DueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    amount: { type: String, required: true }, // due amount
    dueDate: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Cleared"], default: "Pending" },
    highlight: { type: String, enum: ["none", "yellow", "red"], default: "none" },

    // 🔹 Invoice reference
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    invoiceCode: { type: String }, // optional, human-readable
  },
  { timestamps: true }
);

const Due = mongoose.models.Due || mongoose.model("Due", DueSchema);

export default Due;
