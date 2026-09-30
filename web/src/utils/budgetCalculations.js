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

export function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
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
  spentToday = 0,
  month,
  currentDate = new Date(),
}) {
  const budget = Math.max(Number(budgetAmount) || 0, 0);
  const spent = Math.max(Number(spentAmount) || 0, 0);
  const todaySpent = Math.max(Number(spentToday) || 0, 0);
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
  const todayRemaining = Math.max(originalDailyTarget - todaySpent, 0);
  const todayOverspent = Math.max(todaySpent - originalDailyTarget, 0);
  const daysRemainingAfterToday = isCurrentMonth
    ? Math.max(totalDays - currentDate.getDate(), 0)
    : 0;
  const catchUpDailyAmount =
    daysRemainingAfterToday > 0 && todayOverspent > 0 && remaining > 0
      ? remaining / daysRemainingAfterToday
      : 0;

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
    daysRemainingAfterToday,
    remaining,
    originalDailyTarget,
    spentToday: todaySpent,
    todayRemaining,
    todayOverspent,
    catchUpDailyAmount,
    expectedSpent,
    amountAboveTarget,
    status,
    isCurrentMonth,
  };
}
