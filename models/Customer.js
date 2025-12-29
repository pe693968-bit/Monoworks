// models/Customer.js
import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    cnic: { type: String },
    tag: { type: String, enum: ["VIP", "Regular", "New"], default: "New" },
    pending: { type: String, default: "Rs. 0" },
  },
  { timestamps: true }
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

export default Customer;
