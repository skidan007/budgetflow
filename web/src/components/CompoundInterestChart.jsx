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
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={260} minWidth={260}>
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              padding={{ left: 8, right: 8 }}
              minTickGap={4}
              label={{
                value: xAxisLabel,
                position: "insideBottom",
                offset: -8,
                style: { fontSize: 12 },
              }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={52}
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
    </div>
  );
}

export default CompoundInterestChart;
