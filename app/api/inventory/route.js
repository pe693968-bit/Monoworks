import { NextResponse } from "next/server";
import { connectDb } from "@/helpers/db";
import Inventory from "@/models/Inventory";
import { sendAdminEmail } from "@/helpers/email";

/* ------------------- Connect to MongoDB ------------------- */
export async function ensureDb() {
  try {
    await connectDb();
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

/* ------------------- GET (Fetch all products) ------------------- */
export async function GET() {
  await ensureDb();
  try {
    const products = await Inventory.find().sort({ createdAt: -1 });
    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

/* ------------------- POST (Add new product) ------------------- */
export async function POST(req) {
  await ensureDb();
  try {
    const data = await req.json();
    const product = new Inventory({
      name: data.name,
      category: data.category,
      unit: data.unit,
      purchasePrice: Number(data.purchasePrice),
      quantity: Number(data.quantity),
    });

    await product.save();
    return NextResponse.json({ message: "Product added", product }, { status: 201 });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}

export async function PUT(req) {
  await ensureDb();
  try {
    const { id, ...updateData } = await req.json();

    if (!id)
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const updated = await Inventory.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // ✅ Send email to admin
    const emailText = `
      Product Updated!
      Name: ${updated.name}
      Category: ${updated.category}
      Quantity: ${updated.quantity}
      Updated At: ${new Date().toLocaleString()}
    `;
    sendAdminEmail({ subject: `Inventory Updated: ${updated.name}`, text: emailText });

    return NextResponse.json({ message: "Product updated", product: updated }, { status: 200 });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/* ------------------- DELETE (Delete product) ------------------- */
export async function DELETE(req) {
  await ensureDb();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || (await req.json()).id;

    if (!id)
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const deleted = await Inventory.findByIdAndDelete(id);

    if (!deleted)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // ✅ Send email to admin
    const emailText = `
      Product Deleted!
      Name: ${deleted.name}
      Category: ${deleted.category}
      Quantity: ${deleted.quantity}
      Deleted At: ${new Date().toLocaleString()}
    `;
    sendAdminEmail({ subject: `Inventory Deleted: ${deleted.name}`, text: emailText });

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
