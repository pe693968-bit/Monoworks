import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  type: { type: String, default: "inventory" },
  product: String,
  quantity: Number,
  price: Number,
  date: String,
  supplier: String,
}, { timestamps: true });

export default mongoose.models.InventoryReport || mongoose.model("InventoryReport", InventorySchema);
