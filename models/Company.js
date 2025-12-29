import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, default: "" }, // 🔹 Cloudinary URL ya Base64 image
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    terms: { type: String, default: "" }, // 🔹 New field for Terms & Conditions
  },
  { timestamps: true }
);

export default mongoose.models.Company ||
  mongoose.model("Company", CompanySchema);
