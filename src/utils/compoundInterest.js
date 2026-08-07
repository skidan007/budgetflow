// src/utils/compoundInterest.js

const COMPOUND_FREQUENCIES = {
  Daily: 365,
  Weekly: 52,
  Monthly: 12,
  Yearly: 1,
};

const CONTRIBUTION_FREQUENCIES = {
  Weekly: 52,
  "Bi-weekly": 26,
  Monthly: 12,
  Quarterly: 4,
  Yearly: 1,
};

// Greatest common divisor
function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }

  return x;
}

// Least common multiple
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Core investment simulation.
 *
 * Interest and contributions are treated as end-of-period events.
 * If interest and a contribution happen at the same point,
 * interest is applied first and the contribution is added afterward.
 */
function simulateInvestment({
  principal,
  contributionAmount,
  annualRate,
  years,
  compoundFrequency,
  contributionFrequency,
  snapshot,
}) {
  const compoundPeriodsPerYear =
    COMPOUND_FREQUENCIES[compoundFrequency] || 12;

  const contributionPeriodsPerYear =
    CONTRIBUTION_FREQUENCIES[contributionFrequency] || 12;

  const safeYears = Math.max(Number(years) || 0, 0);
  const safePrincipal = Math.max(Number(principal) || 0, 0);
  const safeContributionAmount = Math.max(
    Number(contributionAmount) || 0,
    0,
  );

  const safeAnnualRate = Number(annualRate) || 0;

  /*
   * We create a common timeline so that different frequencies
   * can work together correctly.
   *
   * Example:
   * Daily compounding = 365
   * Monthly contribution = 12
   *
   * Common timeline = LCM(365, 12)
   */
  const basePeriodsPerYear = lcm(
    compoundPeriodsPerYear,
    contributionPeriodsPerYear,
  );

  const totalBasePeriods = Math.round(
    safeYears * basePeriodsPerYear,
  );

  const compoundInterval =
    basePeriodsPerYear / compoundPeriodsPerYear;

  const contributionInterval =
    basePeriodsPerYear / contributionPeriodsPerYear;

  const compoundRate =
    safeAnnualRate / compoundPeriodsPerYear;

  let balance = safePrincipal;
  let contributionCount = 0;

  const data = [];

  for (let period = 1; period <= totalBasePeriods; period++) {
    // Apply compound interest.
    if (period % compoundInterval === 0) {
      balance *= 1 + compoundRate;
    }

    // Add contribution.
    if (period % contributionInterval === 0) {
      balance += safeContributionAmount;
      contributionCount += 1;
    }

    // Create chart snapshots.
    if (snapshot === "Yearly") {
      if (period % basePeriodsPerYear === 0) {
        const year = period / basePeriodsPerYear;

        data.push({
          year,
          value: balance,
        });
      }
    }

    if (snapshot === "Monthly") {
      const monthlyInterval =
        basePeriodsPerYear / 12;

      if (period % monthlyInterval === 0) {
        const month = period / monthlyInterval;

        data.push({
          month,
          value: balance,
        });
      }
    }
  }

  return {
    futureValue: balance,
    contributionCount,
    data,
  };
}

/**
 * Main compound interest calculator.
 */
export function calculateCompoundInterest({
  principal,
  monthlyContribution,
  interestRate,
  inflationRate = 0,
  years,
  frequency = "Monthly",
  contributionFrequency = "Monthly",
  comparisonRates = [],
}) {
  const safePrincipal = Number(principal) || 0;

  const safeContributionAmount =
    Number(monthlyContribution) || 0;

  const safeInterestRate =
    Number(interestRate) || 0;

  const safeInflationRate =
    Number(inflationRate) || 0;

  const safeYears =
    Math.max(Number(years) || 0, 0);

  /*
   * Main investment calculation
   */
  const mainSimulation = simulateInvestment({
    principal: safePrincipal,
    contributionAmount: safeContributionAmount,
    annualRate: safeInterestRate / 100,
    years: safeYears,
    compoundFrequency: frequency,
    contributionFrequency,
  });

  const futureValue =
    mainSimulation.futureValue;

  const totalContributions =
    safePrincipal +
    safeContributionAmount *
      mainSimulation.contributionCount;

  const interestEarned =
    futureValue - totalContributions;

  /*
   * Inflation-adjusted purchasing power.
   */
  const inflationAdjustedValue =
    futureValue /
    Math.pow(
      1 + safeInflationRate / 100,
      safeYears,
    );

  /*
   * Yearly chart data.
   */
  const yearlyData = simulateInvestment({
    principal: safePrincipal,
    contributionAmount: safeContributionAmount,
    annualRate: safeInterestRate / 100,
    years: safeYears,
    compoundFrequency: frequency,
    contributionFrequency,
    snapshot: "Yearly",
  }).data;

  /*
   * Monthly chart data.
   */
  const monthlyData = simulateInvestment({
    principal: safePrincipal,
    contributionAmount: safeContributionAmount,
    annualRate: safeInterestRate / 100,
    years: safeYears,
    compoundFrequency: frequency,
    contributionFrequency,
    snapshot: "Monthly",
  }).data;

  /*
   * Final-value comparison.
   */
  const rateComparisonData =
    comparisonRates.map((comparisonRate) => {
      const numericRate =
        Number(comparisonRate) || 0;

      const simulation =
        simulateInvestment({
          principal: safePrincipal,
          contributionAmount:
            safeContributionAmount,
          annualRate: numericRate / 100,
          years: safeYears,
          compoundFrequency: frequency,
          contributionFrequency,
        });

      return {
        rate: numericRate,
        futureValue: simulation.futureValue,
      };
    });

  /*
   * Year-by-year comparison chart.
   */
  const rateComparisonGrowthData = [];

  const safeComparisonYears =
    Math.floor(safeYears);

  for (
    let year = 1;
    year <= safeComparisonYears;
    year++
  ) {
    const row = {
      year,
    };

    comparisonRates.forEach((comparisonRate) => {
      const numericRate =
        Number(comparisonRate) || 0;

      const simulation =
        simulateInvestment({
          principal: safePrincipal,
          contributionAmount:
            safeContributionAmount,
          annualRate: numericRate / 100,
          years: year,
          compoundFrequency: frequency,
          contributionFrequency,
        });

      row[`rate${numericRate}`] =
        simulation.futureValue;
    });

    rateComparisonGrowthData.push(row);
  }

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