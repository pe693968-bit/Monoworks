"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Chart({ months = [], income = [], expense = [], loading = false }) {
  // Prepare chart data
  const data = months.map((month, idx) => ({
    name: month,
    Income: income[idx] || 0,
    Expense: expense[idx] || 0,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm h-80">
      <h2 className="text-lg font-semibold mb-4 text-gray-600">Income vs Expense</h2>

      {loading ? (
        <div className="flex justify-center items-center h-full text-gray-400">
          Loading chart...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="Income" fill="#22c55e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
