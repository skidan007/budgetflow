import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function CompoundInterestChart({
  data,
  currency,
  growthView,
  setGrowthView,
  xKey,
}) {
  const xAxisLabel = xKey === "year" ? "Year" : "Month";

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Investment Growth</h2>

          <p className="mt-1 text-sm text-slate-500">
            See how your investment grows over time.
          </p>
        </div>

        <select
          value={growthView}
          onChange={(e) => setGrowthView(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
        >
          <option value="Yearly">Yearly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey={xKey}
            label={{
              value: xAxisLabel,
              position: "insideBottom",
              offset: -5,
            }}
          />

          <YAxis
            tickFormatter={(value) =>
              `${currency}${(value / 1000).toFixed(0)}k`
            }
          />

          <Tooltip
            formatter={(value) => [
              `${currency}${Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`,
              "Investment Value",
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
