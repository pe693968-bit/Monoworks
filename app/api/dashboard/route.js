import { NextResponse } from "next/server";
import { connectDb } from "@/helpers/db";
import Invoice from "@/models/Invoice";
import Records from "@/models/Records";
import Customer from "@/models/Customer";
import Inventory from "@/models/Inventory";
import Due from "@/models/Due"; // 👈 Import Due model

export async function GET(req) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);
    let from = searchParams.get("from");
    let to = searchParams.get("to");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let fromDate = from ? new Date(from) : null;
    let toDate = to ? new Date(to) : today;

    if (toDate > today) toDate = today;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    // ---------------------
    // 🧾 Invoices
    // ---------------------
    const invoiceFilter = {};
    if (fromDate || toDate) invoiceFilter.createdAt = {};
    if (fromDate) invoiceFilter.createdAt.$gte = fromDate;
    if (toDate) invoiceFilter.createdAt.$lte = toDate;

    const invoices = await Invoice.find(invoiceFilter);

    const totalIncome = invoices.reduce(
      (sum, inv) => sum + Number(inv.amountPaid || 0),
      0
    );

    const totalPendingDuesFromInvoices = invoices
      .filter((inv) => inv.status === "Pending")
      .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

    // ---------------------
    // ⚠️ Dues (for frontend pending notifications)
    // ---------------------
    const pendingDues = await Due.find({
      status: "Pending",
    });

    // Filter only those whose dueDate has passed
    const overdueDues = pendingDues.filter((due) => {
      const dueDate = new Date(due.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today; // only past dues
    });

    // ---------------------
    // 💸 Expenses
    // ---------------------
    const expenseFilter = { type: "Expense" };
    if (fromDate || toDate) expenseFilter.createdAt = {};
    if (fromDate) expenseFilter.createdAt.$gte = fromDate;
    if (toDate) expenseFilter.createdAt.$lte = toDate;

    const expenses = await Records.find(expenseFilter);
    const totalExpense = expenses.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

    // ---------------------
    // 👥 Customers
    // ---------------------
    const totalCustomers = await Customer.countDocuments();

    // ---------------------
    // 📦 Inventory
    // ---------------------
    const inventories = await Inventory.find({});
    const totalProducts = inventories.length;
    const totalQuantity = inventories.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    // ---------------------
    // 📊 Graph
    // ---------------------
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    invoices.forEach((inv) => {
      const month = new Date(inv.createdAt).getMonth();
      incomeByMonth[month] += Number(inv.amountPaid || 0);
    });

    expenses.forEach((exp) => {
      const month = new Date(exp.createdAt).getMonth();
      expenseByMonth[month] += Number(exp.amount || 0);
    });

    // ---------------------
    // ✅ Final Response
    // ---------------------
    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalCustomers,
      totalPendingDues: totalPendingDuesFromInvoices,
      totalProducts,
      totalQuantity,
      graph: { months, income: incomeByMonth, expense: expenseByMonth },
      pendingDues: overdueDues, // 👈 Only send overdue pending dues
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
