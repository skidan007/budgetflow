export function transactionMonth(transaction) {
  return transaction.month || transaction.date?.slice(0, 7) || "";
}

export function matchesCurrency(transaction, currency) {
  return (transaction.currency || "NGN") === currency;
}

export function transactionsForMonth(transactions, month, currency) {
  return transactions.filter(
    (transaction) => matchesCurrency(transaction, currency) && transactionMonth(transaction) === month,
  );
}

export function totalForType(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
}

export function expenseCategoryTotals(transactions) {
  const totals = new Map();
  transactions.forEach((transaction) => {
    if (transaction.type !== "Expense" || !transaction.category) return;
    totals.set(
      transaction.category,
      (totals.get(transaction.category) || 0) + Number(transaction.amount || 0),
    );
  });
  return [...totals]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function budgetCategorySpent(transactions, budget, month, currency) {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === "Expense" &&
        transaction.category === budget.category &&
        transaction.currency === currency &&
        transactionMonth(transaction) === month,
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
}

export function budgetPerformance(transactions, budget, month, currency) {
  const amount = Number(budget.amount || 0);
  const spent = budgetCategorySpent(transactions, budget, month, currency);
  return {
    amount,
    spent,
    remaining: amount - spent,
    percent: amount ? (spent / amount) * 100 : 0,
  };
}
