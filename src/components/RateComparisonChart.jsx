import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function RateComparisonChart({
  data,
  currency,
  comparisonRates,
  currentRate,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl font-semibold">Interest Rate Comparison</h2>

        <p className="mt-1 text-sm text-slate-500">
          Compare how different interest rates could affect your investment
          growth.
        </p>
      </div>

      <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={260} minWidth={260}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              padding={{ left: 8, right: 8 }}
              minTickGap={4}
              label={{
                value: "Year",
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

            <Legend wrapperStyle={{ paddingTop: 10, fontSize: "11px" }} />

            {comparisonRates.map((rate) => {
              const isCurrentRate = rate === currentRate;

              return (
                <Line
                  key={rate}
                  type="monotone"
                  dataKey={`rate${rate}`}
                  name={isCurrentRate ? `${rate}% (Current)` : `${rate}%`}
                  strokeWidth={isCurrentRate ? 4 : 2}
                  dot={false}
                  strokeLinecap="round"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RateComparisonChart;