import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#6366F1",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#14B8A6",
  "#8B5CF6",
  "#EC4899",
];

function ExpensePieChart({ data, transactions = [] }) {
  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-US");

  const expenseData = Array.isArray(data)
    ? data
    : (Array.isArray(transactions) ? transactions : [])
        .filter((t) => t?.type === "Expense")
        .reduce((acc, transaction) => {
          const category = transaction?.category || "Other";
          const amount = Number(transaction?.amount) || 0;
          const existing = acc.find((item) => item.name === category);

          if (existing) {
            existing.value += amount;
          } else {
            acc.push({
              name: category,
              value: amount,
            });
          }

          return acc;
        }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Expense Breakdown</h2>

      {expenseData.length === 0 ? (
        <p className="text-slate-500">No expense data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={expenseData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label={({ value }) => formatNumber(value)}
            >
              {expenseData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ExpensePieChart;
