import { connectDb } from "@/helpers/db";
import Due from "@/models/Due";
import Invoice from "@/models/Invoice";


function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET all dues
export async function GET() {
  try {
    await connectDb();
    const dues = await Due.find({}).sort({ createdAt: -1 });
    return sendJSON(200, dues);
  } catch (err) {
    console.error("GET error:", err);
    return sendJSON(500, { error: "Server error" });
  }
}

// POST - Add new due
export async function POST(req) {
  try {
    await connectDb();
    const data = await req.json();
    const newDue = await Due.create(data);
    return sendJSON(201, newDue);
  } catch (err) {
    console.error("POST error:", err);
    return sendJSON(500, { error: err.message });
  }
}

// PUT - Update status or details
export async function PUT(req) {
  try {
    await connectDb();
    const { id, ...fields } = await req.json();
    if (!id) return sendJSON(400, { error: "Due id required" });

    const due = await Due.findById(id);
    if (!due) return sendJSON(404, { error: "Due not found" });

    const oldAmount = Number(due.amount);
    const oldStatus = due.status;

    // Update due fields
    if (fields.amount !== undefined) {
      let newAmount = Number(fields.amount);
      if (isNaN(newAmount) || newAmount < 0) return sendJSON(400, { error: "Invalid amount" });

      due.amount = newAmount;
      due.status = newAmount === 0 ? "Cleared" : "Pending";
    }

    if (fields.status === "Cleared") {
      due.amount = 0;
      due.status = "Cleared";
    }

    await due.save();

    // Update invoice if due is linked
    if (due.invoiceId) {
      const invoice = await Invoice.findById(due.invoiceId);
      if (invoice) {
        let diff = oldAmount - Number(due.amount); // difference in paid amount
        if (fields.status === "Cleared") diff = oldAmount; // full payment

        if (diff >= 0) { // ✅ include exact match
          invoice.amountPaid = Number((Number(invoice.amountPaid || 0) + diff).toFixed(2));
          invoice.balanceDue = Math.max(Number(invoice.total || 0) - invoice.amountPaid, 0);
          await invoice.save();
          console.log(`✅ Invoice ${invoice.code} updated after Due update`);
        }
      }
    }

    return sendJSON(200, due);
  } catch (err) {
    console.error("PUT error:", err);
    return sendJSON(500, { error: err.message });
  }
}



// DELETE - Remove a due
export async function DELETE(req) {
  try {
    await connectDb();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return sendJSON(400, { error: "id required" });

    const deleted = await Due.findByIdAndDelete(id);
    if (!deleted) return sendJSON(404, { error: "Due not found" });
    return sendJSON(200, { success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return sendJSON(500, { error: err.message });
  }
}
