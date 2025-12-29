// /app/api/customer-data/route.js
import { connectDb } from "@/helpers/db";
import Invoice from "@/models/Invoice";
import Due from "@/models/Due";

function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req) {
  try {
    await connectDb();
    const url = new URL(req.url);
    const name = url.searchParams.get("name");

    if (!name) return sendJSON(400, { error: "Customer name is required" });

    let sales = await Invoice.find({ billTo: name }).sort({ createdAt: -1 });

    // Calculate totalItems & totalQty for each invoice
    sales = sales.map(inv => ({
      ...inv.toObject(),
      totalItems: inv.items.length,
      totalQty: inv.items.reduce((sum, i) => sum + (i.qty || 0), 0)
    }));

    const dues = await Due.find({ name }).sort({ createdAt: -1 });

    return sendJSON(200, { sales, dues });
  } catch (err) {
    console.error(err);
    return sendJSON(500, { error: "Server error" });
  }
}
