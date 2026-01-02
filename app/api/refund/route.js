import { connectDb } from "@/helpers/db";
import Refund from "@/models/Refund";
import Inventory from "@/models/Inventory";


function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ✅ GET: All refunds
// ✅ GET: All refunds
export async function GET() {
  try {
    await connectDb();
    const refunds = await Refund.find({})
      .sort({ createdAt: -1 })
      .populate("customerId", "name phone")
      .populate("items.productId", "name"); // ← Product name bhi populate kar do

    // ✅ YEH LINE ADD KARO
    return sendJSON(200, { success: true, data: refunds });
    
  } catch (err) {
    console.error("GET Refunds Error:", err);
    return sendJSON(500, { error: "Failed to fetch refunds" });
  }
}

// ✅ POST: Create refund + update inventory
// ✅ POST: Create refund + update inventory (no session)
export async function POST(req) {
  try {
    await connectDb(); // DB connect

    const data = await req.json();
    console.log(data);
    
    const { items } = data;
    console.log(items);
    

    if (!items || items.length === 0) {
      return sendJSON(400, { error: "Refund items are required" });
    }

    // 🔁 Update inventory quantities
    for (const item of items) {
        console.log('items update hona shuru ');
        
      const product = await Inventory.findById(item.productId);
      console.log(product);
      
      if (!product) {
        return sendJSON(404, { error: `Product not found: ${item.productId}` });
      }

      // ✅ Refund = stock increase
      product.quantity += Number(item.qty);
      console.log('product update ho gyi ');
      

      await product.save();
    }

    // ✅ Create refund
    console.log('refund saving');
    
    const refund = await Refund.create(data);
    console.log('saving ho gyi');
    

    // POST ke end mein
return sendJSON(201, { success: true, data: refund });
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
};


// ✅ DELETE: Remove refund (inventory NOT reverted)
export async function DELETE(req) {
  try {
    await connectDb();
    const { id } = await req.json();

    await Refund.findByIdAndDelete(id);
    return sendJSON(200, { success: true });
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}
