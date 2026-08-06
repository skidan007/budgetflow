function CompoundInterestForm({
  principal,
  setPrincipal,
  monthlyContribution,
  setMonthlyContribution,
  interestRate,
  setInterestRate,

  inflationRate,
  setInflationRate,

  years,
  setYears,
  frequency,
  setFrequency,
  currency,
  setCurrency,
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Investment Details</h2>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Currency */}
        <div>
          <label className="mb-2 block text-sm font-medium">Currency</label>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="₦">₦ Nigerian Naira</option>
            <option value="$">$ US Dollar</option>
            <option value="£">£ British Pound</option>
            <option value="€">€ Euro</option>
          </select>
        </div>

        {/* Initial Investment */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Initial Investment
          </label>

          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {/* Monthly Contribution */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Monthly Contribution
          </label>

          <input
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Annual Interest Rate (%)
          </label>

          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Inflation Rate (%)
          </label>

          <input
            type="number"
            value={inflationRate}
            onChange={(e) => setInflationRate(Number(e.target.value))}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {/* Years */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Investment Duration (Years)
          </label>

          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Compound Frequency
          </label>

          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Yearly</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default CompoundInterestForm;
