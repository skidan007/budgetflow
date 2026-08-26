function parseBudgetMonth(month) {
  const [year, monthNumber] = String(month || "").split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return { year, monthNumber };
}

export function getDaysInMonth(month) {
  const parsedMonth = parseBudgetMonth(month);

  return parsedMonth
    ? new Date(parsedMonth.year, parsedMonth.monthNumber, 0).getDate()
    : 0;
}

export function getBudgetDaysRemaining(month, currentDate = new Date()) {
  const parsedMonth = parseBudgetMonth(month);

  if (!parsedMonth) return 0;

  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  if (month !== currentMonth) return 0;

  return Math.max(getDaysInMonth(month) - currentDate.getDate() + 1, 0);
}

export function calculateDailyBudgetStatus({
  budgetAmount,
  spentAmount,
  month,
  currentDate = new Date(),
}) {
  const budget = Math.max(Number(budgetAmount) || 0, 0);
  const spent = Math.max(Number(spentAmount) || 0, 0);
  const totalDays = getDaysInMonth(month);
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  const isCurrentMonth = month === currentMonth;
  const daysElapsed = isCurrentMonth ? Math.min(currentDate.getDate(), totalDays) : 0;
  const daysRemaining = isCurrentMonth
    ? getBudgetDaysRemaining(month, currentDate)
    : 0;
  const remaining = budget - spent;
  const originalDailyTarget = totalDays > 0 ? budget / totalDays : 0;
  const expectedSpent = originalDailyTarget * daysElapsed;
  const amountAboveTarget = Math.max(spent - expectedSpent, 0);
  const recommendedDailySpending =
    daysRemaining > 0 ? Math.max(remaining, 0) / daysRemaining : 0;

  let status = "not_current";

  if (isCurrentMonth) {
    if (remaining < 0) {
      status = "exceeded";
    } else if (remaining === 0) {
      status = "budget_reached";
    } else if (spent <= expectedSpent) {
      status = "on_track";
    } else if (spent <= expectedSpent * 1.1) {
      status = "slightly_above";
    } else {
      status = "overspending";
    }
  }

  return {
    totalDays,
    daysElapsed,
    daysRemaining,
    remaining,
    originalDailyTarget,
    recommendedDailySpending,
    expectedSpent,
    amountAboveTarget,
    status,
    isCurrentMonth,
  };
}
