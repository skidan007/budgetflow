export function calculateCompoundInterest({
  principal,
  monthlyContribution,
  interestRate,
  inflationRate = 0,
  years,
  frequency,
}) {
  const frequencies = {
    Daily: 365,
    Weekly: 52,
    Monthly: 12,
    Quarterly: 4,
    Yearly: 1,
  };

  const n = frequencies[frequency] || 12;
  const r = Number(interestRate) / 100;
  const safeInflationRate = Number(inflationRate) || 0;
  const safePrincipal = Number(principal) || 0;
  const safeMonthlyContribution = Number(monthlyContribution) || 0;
  const safeYears = Number(years) || 0;
  const totalPeriods = safeYears * n;

  let futurePrincipal = safePrincipal;
  let futureContributions = safeMonthlyContribution * safeYears * 12;

  if (r > 0) {
    futurePrincipal = safePrincipal * Math.pow(1 + r / n, totalPeriods);
    futureContributions =
      safeMonthlyContribution *
      ((Math.pow(1 + r / n, totalPeriods) - 1) / (r / n));
  }

  const futureValue = futurePrincipal + futureContributions;
  const totalContributions =
    safePrincipal + safeMonthlyContribution * safeYears * 12;
  const interestEarned = futureValue - totalContributions;
  const inflationAdjustedValue =
    futureValue / Math.pow(1 + safeInflationRate / 100, safeYears);

  const yearlyData = [];

  for (let year = 1; year <= safeYears; year++) {
    const periods = year * n;

    let yearlyFuturePrincipal = safePrincipal;
    let yearlyFutureContribution = safeMonthlyContribution * year * 12;

    if (r > 0) {
      yearlyFuturePrincipal = safePrincipal * Math.pow(1 + r / n, periods);
      yearlyFutureContribution =
        safeMonthlyContribution *
        ((Math.pow(1 + r / n, periods) - 1) / (r / n));
    }

    yearlyData.push({
      year,
      value: yearlyFuturePrincipal + yearlyFutureContribution,
    });
  }

  return {
    futureValue,
    totalContributions,
    interestEarned,
    inflationAdjustedValue,
    yearlyData,
  };
}
