import { NextResponse } from "next/server";
import { connectDb } from "@/helpers/db";
import Company from "@/models/Company";
import cloudinary from "@/helpers/cloudinary";

export async function GET() {
  await connectDb();

  try {
    const company = await Company.findOne();
    return NextResponse.json(company || {});
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch company details" }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDb();

  try {
    const data = await req.json();

    // 🔹 Default logo (if existing)
    let logoUrl = data.logo;

    // 🔹 Upload new logo if it's base64
    if (data.logo && data.logo.startsWith("data:image")) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(data.logo, {
          folder: "company_logos",
        });
        logoUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return NextResponse.json({ success: false, error: "Image upload failed" }, { status: 500 });
      }
    }

    // 🔹 Prepare data (including terms)
    const companyData = {
      name: data.name || "",
      address: data.address || "",
      phone: data.phone || "",
      logo: logoUrl || "",
      terms: data.terms || "",
    };

    // 🔹 Save or update
    let company = await Company.findOne();
    if (company) {
      company.set(companyData);
      await company.save();
    } else {
      company = await Company.create(companyData);
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Error saving company:", error);
    return NextResponse.json({ success: false, error: "Failed to save company details" }, { status: 500 });
  }
}
