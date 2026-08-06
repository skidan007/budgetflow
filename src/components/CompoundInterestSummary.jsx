function CompoundInterestSummary({
  currency,
  futureValue,
  totalContributions,
  interestEarned,
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Investment Summary</h2>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl bg-indigo-50 p-5">
          <p className="text-sm text-slate-500">Future Value</p>

          <h3 className="mt-2 text-2xl font-bold text-indigo-700">
            {currency}
            {futureValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </h3>
        </div>

        <div className="rounded-xl bg-green-50 p-5">
          <p className="text-sm text-slate-500">Total Contributions</p>

          <h3 className="mt-2 text-2xl font-bold text-green-700">
            {currency}
            {totalContributions.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-xl bg-purple-50 p-5">
          <p className="text-sm text-slate-500">Interest Earned</p>

          <h3 className="mt-2 text-2xl font-bold text-purple-700">
            {currency}
            {interestEarned.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default CompoundInterestSummary;
