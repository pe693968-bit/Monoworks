// Optional: agar aap Mongoose use karna chaho
import mongoose from "mongoose";

const RecordSchema = new mongoose.Schema({
  description: { type: String, required: true },         // Kya cheez hai
  type: { type: String, enum: ["Income", "Expense"], required: true }, // Income ya Expense
  amount: { type: Number, required: true },             // Amount
  paymentMethod: { type: String, enum: ["Cash", "Bank", "Online", "Cheque"], required: true }, // Payment k source
  category: { type: String, default: "General" },       // Kis cheez pe kharcha/earning hui
  receivedFrom: { type: String, default: "" },          // Agar income hai to kahan se aa rahi
  spentOn: { type: String, default: "" },               // Agar expense hai to kis cheez pe
  notes: { type: String, default: "" },                 // Extra info
  date: { type: Date, default: Date.now },             // Record ka date
}, { timestamps: true });

export default mongoose.models.Record || mongoose.model("Record", RecordSchema);
