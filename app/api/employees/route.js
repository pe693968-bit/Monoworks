import { connectDb } from "@/helpers/db";
import Employee from "@/models/Employee";

function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ✅ GET: All employees
export async function GET() {
  try {
    await connectDb();
    const employees = await Employee.find({}).sort({ createdAt: -1 });
    return sendJSON(200, employees);
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}

// ✅ POST: Add new employee
export async function POST(req) {
  try {
    await connectDb();
    const data = await req.json();

    // Required fields
    const { name, profession, empId, address, contact, salary } = data;
    if (!name || !profession || !empId || !address || !contact || !salary) {
      return sendJSON(400, { error: "All fields are required" });
    }

    const employee = await Employee.create({
      name,
      profession,
      empId,
      address,
      contact,
      salary,
      status: "Pending",
    });

    return sendJSON(201, employee);
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}

// ✅ PUT: Update employee status (Paid / Pending)
export async function PUT(req) {
  try {
    await connectDb();
    const { id, status } = await req.json();
    if (!id || !status) {
      return sendJSON(400, { error: "ID and status are required" });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    return sendJSON(200, employee);
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}

// ✅ DELETE: Remove an employee
export async function DELETE(req) {
  try {
    await connectDb();
    const { id } = await req.json();
    if (!id) {
      return sendJSON(400, { error: "ID is required" });
    }

    await Employee.findByIdAndDelete(id);
    return sendJSON(200, { success: true });
  } catch (err) {
    return sendJSON(500, { error: err.message });
  }
}
