import { connectDb } from "@/helpers/db";
import Records from "@/models/Records";

export async function GET(req) {
  try {
    await connectDb();
    const records = await Records.find({}).sort({ date: -1 }); // latest first
    return new Response(JSON.stringify(records), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch records" }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDb();
    const data = await req.json();

    const newRecord = await Records.create({
      description: data.description,
      type: data.type,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      category: data.category || "General",
      receivedFrom: data.source || "",
      spentOn: data.spentOn || "",
      notes: data.notes || "",
      date: data.date || new Date(),
    });

    return new Response(JSON.stringify(newRecord), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to add record" }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDb();
    const { id } = await req.json();
    if (!id) return new Response(JSON.stringify({ error: "Record ID missing" }), { status: 400 });

    await Records.findByIdAndDelete(id);
    return new Response(JSON.stringify({ message: "Record deleted" }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to delete record" }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDb();
    const data = await req.json();
    const { id, ...updateData } = data;
    if (!id) return new Response(JSON.stringify({ error: "Record ID missing" }), { status: 400 });

    const updated = await Records.findByIdAndUpdate(id, updateData, { new: true });
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to update record" }), { status: 500 });
  }
}
