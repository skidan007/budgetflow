export function calculateCompoundInterest({
  principal,
  monthlyContribution,
  interestRate,
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
  const r = interestRate / 100;
  const totalPeriods = years * n;

  let futurePrincipal = principal;
  let futureContributions = monthlyContribution * years * 12;

  if (r > 0) {
    futurePrincipal =
      principal * Math.pow(1 + r / n, totalPeriods);

    futureContributions =
      monthlyContribution *
      ((Math.pow(1 + r / n, totalPeriods) - 1) / (r / n));
  }

  const futureValue = futurePrincipal + futureContributions;

  const totalContributions =
    principal + monthlyContribution * years * 12;

  const interestEarned =
    futureValue - totalContributions;

  return {
    futureValue,
    totalContributions,
    interestEarned,
  };
}