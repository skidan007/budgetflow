import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function RateComparisonChart({ data, currency, comparisonRates, currentRate }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Interest Rate Comparison</h2>

        <p className="mt-1 text-sm text-slate-500">
          Compare your current rate with alternative interest rates.
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="year"
              label={{
                value: "Year",
                position: "insideBottom",
                offset: -10,
              }}
            />

            <YAxis
              tickFormatter={(value) =>
                `${currency}${Number(value).toLocaleString()}`
              }
            />

            <Tooltip
              formatter={(value) =>
                `${currency}${Number(value).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              }
            />

            <Legend />

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
