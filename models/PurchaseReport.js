import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
  type: { type: String, default: "purchase" },
  name: String, // Supplier name
  invoice: String,
  date: String,
  product: String,
  quantity: Number,
  price: Number,
  payment: String, // Cash or Credit
}, { timestamps: true });

export default mongoose.models.PurchaseReport || mongoose.model("PurchaseReport", PurchaseSchema);
