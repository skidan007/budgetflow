function CompoundInterestSummary({
  currency,
  futureValue,
  totalContributions,
  interestEarned,
  inflationAdjustedValue,
}) {
  const safeFutureValue = Number(futureValue) || 0;
  const safeTotalContributions = Number(totalContributions) || 0;
  const safeInterestEarned = Number(interestEarned) || 0;
  const safeInflationAdjustedValue = Number(inflationAdjustedValue) || 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Investment Summary</h2>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl bg-indigo-50 p-5">
          <p className="text-sm text-slate-500">Future Value</p>

          <h3 className="mt-2 text-2xl font-bold text-indigo-700">
            {currency}
            {safeFutureValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </h3>
        </div>
        <div className="rounded-xl bg-green-50 p-5">
          <p className="text-sm text-slate-500">Total Contributions</p>

          <h3 className="mt-2 text-2xl font-bold text-green-700">
            {currency}
            {safeTotalContributions.toLocaleString()}
          </h3>
        </div>
        <div className="rounded-xl bg-purple-50 p-5">
          <p className="text-sm text-slate-500">Interest Earned</p>

          <h3 className="mt-2 text-2xl font-bold text-purple-700">
            {currency}
            {safeInterestEarned.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </h3>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="text-sm font-medium text-orange-700">
            Purchasing Power Today
          </h3>

          <p className="mt-2 text-2xl font-bold">
            {currency}
            {safeInflationAdjustedValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>

          <p className="mt-2 text-sm text-orange-600">
            Estimated value after inflation.
          </p>

          <p className="mt-4 rounded-lg bg-orange-100 p-3 text-sm text-orange-700">
            Although your investment could grow to{" "}
            <strong>
              {currency}
              {safeFutureValue.toLocaleString()}
            </strong>
            , its purchasing power may be closer to{" "}
            <strong>
              {currency}
              {safeInflationAdjustedValue.toLocaleString()}
            </strong>{" "}
            after accounting for inflation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompoundInterestSummary;
