import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28CFF",
  "#FF6699",
];

function ExpensePieChart({ data, currency = "₦" }) {
  // Always convert incoming data into a safe array
  const chartData = Array.isArray(data) ? data : [];

  const formatAmount = (value) => {
    return `${currency}${Number(value || 0).toLocaleString("en-US")}`;
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <h2 className="text-lg font-semibold text-slate-900">
        Expense Breakdown
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        See where your money is going.
      </p>

      {chartData.length === 0 ? (
        <div className="flex h-80 items-center justify-center">
          <p className="text-sm text-slate-500">
            No expense data available yet.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={115}
              label={({ value }) => formatAmount(value)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [
                formatAmount(value),
                "Amount",
              ]}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ExpensePieChart;