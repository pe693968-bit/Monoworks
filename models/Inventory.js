import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { timestamps: true }
);

const Inventory =
  mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);

export default Inventory;
