export function calculateCompoundInterest({
  principal,
  monthlyContribution,
  interestRate,
  inflationRate = 0,
  years,
  frequency,
  comparisonRates = [],
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

  const monthlyData = [];

  for (let month = 1; month <= safeYears * 12; month++) {
    const monthlyRate = r / 12;

    let value;

    if (monthlyRate > 0) {
      value =
        safePrincipal * Math.pow(1 + monthlyRate, month) +
        safeMonthlyContribution *
          ((Math.pow(1 + monthlyRate, month) - 1) / monthlyRate);
    } else {
      value = safePrincipal + safeMonthlyContribution * month;
    }

    monthlyData.push({
      month,
      value,
    });
  }

  const rateComparisonGrowthData = [];

  for (let year = 1; year <= safeYears; year++) {
    const row = {
      year,
    };

    comparisonRates.forEach((comparisonRate) => {
      const comparisonR = Number(comparisonRate) / 100;
      const periods = year * n;

      const growth = Math.pow(1 + comparisonR / n, periods);

      const principalGrowth = safePrincipal * growth;

      const contributionGrowth =
        comparisonR > 0
          ? safeMonthlyContribution * ((growth - 1) / (comparisonR / n))
          : safeMonthlyContribution * year * 12;

      row[`rate${comparisonRate}`] = principalGrowth + contributionGrowth;
    });

    rateComparisonGrowthData.push(row);
  }

 

  const rateComparisonData = comparisonRates.map((comparisonRate) => {
    const comparisonRateDecimal = comparisonRate / 100;

    const comparisonFutureValue =
      comparisonRateDecimal > 0
        ? safePrincipal *
            Math.pow(1 + comparisonRateDecimal / n, totalPeriods) +
          safeMonthlyContribution *
            ((Math.pow(1 + comparisonRateDecimal / n, totalPeriods) - 1) /
              (comparisonRateDecimal / n))
        : safePrincipal + safeMonthlyContribution * safeYears * 12;

    return {
      rate: comparisonRate,
      futureValue: comparisonFutureValue,
    };
  });

  return {
    futureValue,
    totalContributions,
    interestEarned,
    inflationAdjustedValue,
    yearlyData,
    monthlyData,
    rateComparisonData,
    rateComparisonGrowthData,
  };
}
