import Invoice from "@/models/Invoice";
import { connectDb } from "@/helpers/db";
export async function GET(req, { params }) {
  await connectDb();
  const invoice = await Invoice.findById(params.id);
  if (!invoice) return new Response("Invoice not found", { status: 404 });
  return new Response(JSON.stringify(invoice), { status: 200 });
}
