import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    profession: { type: String, required: true },
    empId: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    salary: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  },
  { timestamps: true }
);

// Check if model already exists (Next.js hot reload issue)
export default mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
