function monthDays(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(month || ""));
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return 0;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
}

function isoDateForDay(month, day) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function weeklyBudgetSummary({ budget, transactions, today }) {
  const month = String(budget?.month || "");
  const daysInBudgetMonth = monthDays(month);
  if (!daysInBudgetMonth || !/^\d{4}-\d{2}-\d{2}$/.test(today || "") || today.slice(0, 7) !== month) return null;

  const dayOfMonth = Math.min(Math.max(Number(today.slice(8, 10)) || 1, 1), daysInBudgetMonth);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const weekStartDay = Math.max(dayOfMonth - ((weekday + 6) % 7), 1);
  const weekEndDay = Math.min(weekStartDay + 6, daysInBudgetMonth);
  const startDate = isoDateForDay(month, weekStartDay);
  const weeklyTarget = (Number(budget.amount) || 0) / daysInBudgetMonth * (weekEndDay - weekStartDay + 1);
  const spent = (transactions || []).reduce((total, transaction) => {
    const transactionMonth = transaction.month || transaction.date?.slice(0, 7);
    if (
      transaction.type !== "Expense" ||
      transaction.category !== budget.category ||
      transaction.currency !== budget.currency ||
      transactionMonth !== month ||
      !transaction.date || transaction.date < startDate || transaction.date > today
    ) return total;
    return total + Number(transaction.amount || 0);
  }, 0);
  const remaining = weeklyTarget - spent;

  return {
    startDate,
    endDate: isoDateForDay(month, weekEndDay),
    days: weekEndDay - weekStartDay + 1,
    target: weeklyTarget,
    spent,
    remaining,
    status: remaining < 0 ? "Over weekly target" : remaining === 0 ? "At weekly target" : "Within weekly target",
  };
}
