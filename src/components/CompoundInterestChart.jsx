import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function CompoundInterestChart({ data = [], currency }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Investment Growth</h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="year" />

          <YAxis
            tickFormatter={(value) => `${currency}${(value / 1000).toFixed(0)}k`}
          />

          <Tooltip
            formatter={(value) => [
              `${currency}${Number(value).toLocaleString()}`,
              "Value",
            ]}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#4F46E5"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CompoundInterestChart;
