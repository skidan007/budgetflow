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

function ExpensePieChart({ data = [] }) {
  const validData = Array.isArray(data)
    ? data.filter(
        (item) =>
          item &&
          typeof item.name === "string" &&
          Number(item.value) > 0,
      )
    : [];

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold text-slate-900">
        Expense Breakdown by Category
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        See where your money is going.
      </p>

      {validData.length === 0 ? (
        <div className="flex h-80 items-center justify-center">
          <p className="text-sm text-slate-500">
            No expense data available yet.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={validData}
              dataKey="value"
              nameKey="name"
              outerRadius={115}
            >
              {validData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [
                `₦${Number(value).toLocaleString()}`,
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