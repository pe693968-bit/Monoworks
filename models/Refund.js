import mongoose from "mongoose";

const RefundSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Items array (productId, qty, amount)
    items: [
      {
        productId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Inventory", 
          required: true 
        },
        qty: { type: Number, required: true, min: 1 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],

    reason: {
      type: String,
      trim: true,
    },

    refundDate: {
      type: Date,
      default: Date.now,
    },

    method: {
      type: String,
      enum: ["cash", "bank", "online"],
      default: "cash",
    },
    method: {
      type: String,
      enum: ["cash", "bank", "online"],
      default: "cash",
    },

    // ← Add this
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

  },
  { timestamps: true }
);

export default mongoose.models.Refund || mongoose.model("Refund", RefundSchema);
