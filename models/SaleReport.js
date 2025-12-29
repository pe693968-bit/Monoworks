import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema({
  type: { type: String, default: "sale" },
  name: String, // Customer name
  invoice: String,
  date: String,
  product: String,
  quantity: Number,
  price: Number,
  cnic: String,
  contact: String,
  payment: String, // Cash or Credit
}, { timestamps: true });

export default mongoose.models.SaleReport || mongoose.model("SaleReport", SaleSchema);
