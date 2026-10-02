const COMPOUND_FREQUENCIES = { Daily: 365, Weekly: 52, Monthly: 12, Yearly: 1 };
const CONTRIBUTION_FREQUENCIES = {
  Weekly: 52,
  "Bi-weekly": 26,
  Monthly: 12,
  Quarterly: 4,
  Yearly: 1,
};

function gcd(a, b) {
  let x = Math.abs(a), y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function simulate({ principal, contributionAmount, annualRate, years, compoundFrequency, contributionFrequency }) {
  const compoundPeriodsPerYear = COMPOUND_FREQUENCIES[compoundFrequency] || 12;
  const contributionPeriodsPerYear = CONTRIBUTION_FREQUENCIES[contributionFrequency] || 12;
  const safeYears = Math.max(Number(years) || 0, 0);
  const safePrincipal = Math.max(Number(principal) || 0, 0);
  const safeContribution = Math.max(Number(contributionAmount) || 0, 0);
  const basePeriodsPerYear = lcm(compoundPeriodsPerYear, contributionPeriodsPerYear);
  const totalPeriods = Math.round(safeYears * basePeriodsPerYear);
  const compoundInterval = basePeriodsPerYear / compoundPeriodsPerYear;
  const contributionInterval = basePeriodsPerYear / contributionPeriodsPerYear;
  const compoundRate = Number(annualRate) / compoundPeriodsPerYear;
  let balance = safePrincipal;
  let contributionCount = 0;

  for (let period = 1; period <= totalPeriods; period++) {
    if (period % compoundInterval === 0) balance *= 1 + compoundRate;
    if (period % contributionInterval === 0) {
      balance += safeContribution;
      contributionCount++;
    }
  }

  return { balance, contributionCount };
}

export function calculateCompoundInterest({
  principal,
  monthlyContribution,
  interestRate,
  inflationRate = 0,
  years,
  frequency = "Monthly",
  contributionFrequency = "Monthly",
}) {
  const numericPrincipal = Number(principal);
  const numericContribution = Number(monthlyContribution);
  const numericRate = Number(interestRate);
  const numericInflation = Number(inflationRate);
  const numericYears = Number(years);
  const simulation = simulate({
    principal: numericPrincipal,
    contributionAmount: numericContribution,
    annualRate: numericRate / 100,
    years: numericYears,
    compoundFrequency: frequency,
    contributionFrequency,
  });
  const totalContributions = numericPrincipal + numericContribution * simulation.contributionCount;
  const futureValue = simulation.balance;
  return {
    futureValue,
    totalContributions,
    interestEarned: futureValue - totalContributions,
    inflationAdjustedValue: futureValue / Math.pow(1 + numericInflation / 100, Math.max(numericYears, 0)),
    contributionCount: simulation.contributionCount,
  };
}

export function validateCompoundInputs({ principal, monthlyContribution, interestRate, inflationRate, years }) {
  const errors = {};
  const validateNonNegative = (value, key, missingMessage, invalidMessage) => {
    if (String(value).trim() === "") errors[key] = missingMessage;
    else if (!Number.isFinite(Number(value)) || Number(value) < 0) errors[key] = invalidMessage;
  };

  validateNonNegative(principal, "principal", "Enter an initial investment.", "Initial investment must be zero or greater.");
  validateNonNegative(monthlyContribution, "contribution", "Enter a contribution amount.", "Contribution must be zero or greater.");
  validateNonNegative(interestRate, "rate", "Enter an annual interest rate.", "Interest rate must be zero or greater.");
  validateNonNegative(inflationRate, "inflation", "Enter an inflation rate.", "Inflation rate must be zero or greater.");
  if (String(years).trim() === "") errors.years = "Enter an investment period.";
  else if (!Number.isFinite(Number(years)) || Number(years) <= 0) errors.years = "Enter a valid investment period greater than zero.";
  return errors;
}
