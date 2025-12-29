import { NextResponse } from "next/server";
import { connectDb } from "@/helpers/db";
import SaleReport from "@/models/SaleReport";
import PurchaseReport from "@/models/PurchaseReport";

// 🔹 Helper function to get model based on report type
function getModel(type) {
  switch (type) {
    case "purchase":
      return PurchaseReport;
    case "sale":
      return SaleReport;
    default:
      throw new Error("Invalid report type");
  }
}

// 🔹 GET — fetch reports by type
export async function GET(req) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // example: ?type=purchase
    if (!type) {
      return NextResponse.json(
        { error: "Report type is required (purchase, sale)" },
        { status: 400 }
      );
    }

    const Model = getModel(type);
    const reports = await Model.find().sort({ createdAt: -1 });
    return NextResponse.json(reports);
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 POST — create new report
export async function POST(req) {
  try {
    await connectDb();
    const body = await req.json();
    const { reportType, ...data } = body;

    if (!reportType) {
      return NextResponse.json(
        { error: "reportType is required in body" },
        { status: 400 }
      );
    }

    const Model = getModel(reportType);
    const newReport = await Model.create(data);
    return NextResponse.json(newReport);
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 DELETE — delete report by ID and type
export async function DELETE(req) {
  try {
    await connectDb();
    const body = await req.json();
    const { reportType, id } = body;

    if (!reportType || !id) {
      return NextResponse.json(
        { error: "Both reportType and id are required" },
        { status: 400 }
      );
    }

    const Model = getModel(reportType);
    const deleted = await Model.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
