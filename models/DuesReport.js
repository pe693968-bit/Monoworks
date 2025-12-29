import mongoose from "mongoose";

const DuesSchema = new mongoose.Schema({
  type: { type: String, default: "dues" },
  name: String,
  invoice: String,
  date: String,
  product: String,
  quantity: Number,
  price: Number,
  payment: { type: String, default: "Pending" },
}, { timestamps: true });

export default mongoose.models.DuesReport || mongoose.model("DuesReport", DuesSchema);
