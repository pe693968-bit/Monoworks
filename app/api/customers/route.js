import { connectDb } from "@/helpers/db";
import Customer from "@/models/Customer";

function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ✅ GET: All customers
export async function GET() {
  try {
    await connectDb();
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    return sendJSON(200, customers);
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}

// ✅ POST: Add new customer
export async function POST(req) {
  try {
    await connectDb();
    const data = await req.json();
    const customer = await Customer.create(data);
    return sendJSON(201, customer);
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}

// ✅ DELETE: Remove a customer
export async function DELETE(req) {
  try {
    await connectDb();
    const { id } = await req.json();
    await Customer.findByIdAndDelete(id);
    return sendJSON(200, { success: true });
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}
