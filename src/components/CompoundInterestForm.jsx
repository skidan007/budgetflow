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
  contributionFrequency,
  setContributionFrequency,
  currency,
  setCurrency,
}) {
  const errors = {
    principal: principal !== "" && Number(principal) < 0,

    contribution: monthlyContribution !== "" && Number(monthlyContribution) < 0,

    interestRate: interestRate !== "" && Number(interestRate) < 0,

    inflationRate: inflationRate !== "" && Number(inflationRate) < 0,

    years: years !== "" && Number(years) <= 0,
  };

  const inputClass = (hasError) =>
    `w-full rounded-lg border p-3 outline-none transition ${
      hasError
        ? "border-red-500 focus:border-red-500"
        : "border-slate-300 focus:border-indigo-500"
    }`;

  const currencies = [
    { symbol: "₦", name: "Nigerian Naira" },
    { symbol: "$", name: "US Dollar" },
    { symbol: "£", name: "British Pound" },
    { symbol: "€", name: "Euro" },
    { symbol: "¥", name: "Japanese Yen" },
    { symbol: "¥", name: "Chinese Yuan" },
    { symbol: "₹", name: "Indian Rupee" },
    { symbol: "₵", name: "Ghanaian Cedi" },
    { symbol: "R", name: "South African Rand" },
    { symbol: "C$", name: "Canadian Dollar" },
    { symbol: "A$", name: "Australian Dollar" },
  ];

  // const errors = {
  //   principal: Number(principal) < 0,
  //   contribution: Number(monthlyContribution) < 0,
  //   interestRate: Number(interestRate) < 0,
  //   inflationRate: Number(inflationRate) < 0,
  //   years: Number(years) <= 0,
  // };

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Investment Details</h2>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
        {/* Currency */}
        <div>
          <label className="mb-2 block text-sm font-medium">Currency</label>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
          >
            {currencies.map((item) => (
              <option key={`${item.symbol}-${item.name}`} value={item.symbol}>
                {item.symbol} {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Investment */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Initial Investment
          </label>

          <input
            type="number"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className={`${inputClass(errors.principal)}  no-spinner`}
            placeholder="Enter initial investment"
          />

          {errors.principal && (
            <p className="mt-1 text-sm text-red-600">
              Initial investment cannot be negative.
            </p>
          )}
        </div>

        {/* Contribution Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Additional Amount
          </label>

          <input
            type="number"
            min="0"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            placeholder="Enter monthly contribution"
            className={`${inputClass(errors.contribution)}  no-spinner`}
          />
          {errors.contribution && (
            <p className="mt-1 text-sm text-red-600">
              Contribution amount cannot be negative.
            </p>
          )}
        </div>

        {/* <div className="flex items-center justify-between rounded-lg border p-3">
          

          <input
            type="number"
            className="w-32 text-left outline-none"
            placeholder="0"
          />
          <span className="text-slate-500">Income</span>
        </div> */}

        {/* Investment Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium">Duration</label>
          <div className="flex items-center rounded-lg border border-slate-300 bg-white pr-2">
            <input
              type="number"
              min="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="Enter duration"
              className={`${inputClass(errors.years)} flex-1 border-0 bg-transparent outline-none no-spinner`}
            />

            <span className="ml-5 text-slate-500">Years</span>
          </div>

          {errors.years && (
            <p className="mt-1 text-sm text-red-600">
              Investment duration must be at least 1 year.
            </p>
          )}
        </div>

        {/* Annual Interest Rate */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Annual Interest
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 bg-white pr-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className={`${inputClass(errors.interestRate)} flex-1 border-0 bg-transparent outline-none no-spinner`}
              placeholder="Enter annual interest rate"
            />
            <span className="ml-5 text-slate-500">%</span>
          </div>
          {errors.interestRate && (
            <p className="mt-1 text-sm text-red-600">
              Interest rate cannot be negative.
            </p>
          )}
        </div>

        {/* Inflation Rate */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Inflation Rate (%)
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 bg-white pr-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
              className={`${inputClass(errors.inflationRate)} flex-1 border-0 bg-transparent outline-none no-spinner`}
              placeholder="Enter inflation rate"
            />
            <span className="ml-5 text-slate-500">%</span>
          </div>
          {errors.inflationRate && (
            <p className="mt-1 text-sm text-red-600">
              Inflation rate cannot be negative.
            </p>
          )}
        </div>

        {/* Compound Frequency */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Compound Frequency
          </label>

          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        {/* Contribution Frequency */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Contribution Frequency
          </label>

          <select
            value={contributionFrequency}
            onChange={(e) => setContributionFrequency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
          >
            <option value="Weekly">Weekly</option>
            <option value="Bi-weekly">Bi-weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default CompoundInterestForm;
