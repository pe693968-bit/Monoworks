import Invoice from "@/models/Invoice";
import { connectDb } from "@/helpers/db";

export async function GET(req, context) {
  const { id } = await context.params; // 👈 REAL FIX
  await connectDb();

  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return Response.json({ message: "Invoice not found" }, { status: 404 });
  }

  return Response.json(invoice, { status: 200 });
}
