import { createContext, useContext, useEffect, useState } from "react";

const FinanceContext = createContext();

function readStoredValue(key, fallbackValue) {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return fallbackValue;
  }
}

function parseStoredArray(key) {
  const parsedValue = readStoredValue(key, []);
  return Array.isArray(parsedValue) ? parsedValue : [];
}

function normalizeTransactions(items) {
  return items.reduce((acc, transaction, index) => {
    if (!transaction || typeof transaction !== "object") {
      return acc;
    }

    const type = transaction.type === "Income" ? "Income" : transaction.type === "Expense" ? "Expense" : null;
    const category = typeof transaction.category === "string" ? transaction.category.trim() : "";
    const amount = Number(transaction.amount);
    const date = typeof transaction.date === "string" && transaction.date ? transaction.date : new Date().toISOString().split("T")[0];

    if (!type || !category || Number.isNaN(amount)) {
      return acc;
    }

    acc.push({
      id: transaction.id ?? `transaction-${index}`,
      type,
      category,
      amount,
      date,
    });

    return acc;
  }, []);
}

function normalizeGoals(items) {
  return items.reduce((acc, goal, index) => {
    if (!goal || typeof goal !== "object") {
      return acc;
    }

    const name = typeof goal.name === "string" ? goal.name.trim() : "";
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount ?? 0);

    if (!name || Number.isNaN(targetAmount) || targetAmount <= 0) {
      return acc;
    }

    const savingsHistory = Array.isArray(goal.savingsHistory)
      ? goal.savingsHistory.reduce((historyAcc, saving, savingIndex) => {
          if (!saving || typeof saving !== "object") {
            return historyAcc;
          }

          const amount = Number(saving.amount);

          if (Number.isNaN(amount) || amount <= 0) {
            return historyAcc;
          }

          historyAcc.push({
            id: saving.id ?? `saving-${index}-${savingIndex}`,
            amount,
            date:
              typeof saving.date === "string" && saving.date
                ? saving.date
                : new Date().toISOString().split("T")[0],
          });

          return historyAcc;
        }, [])
      : [];

    acc.push({
      id: goal.id ?? `goal-${index}`,
      name,
      type: typeof goal.type === "string" && goal.type ? goal.type : "🎯 Goal",
      targetAmount,
      currentAmount: Number.isNaN(currentAmount) ? 0 : currentAmount,
      targetDate:
        typeof goal.targetDate === "string" ? goal.targetDate : "",
      currency:
        typeof goal.currency === "string" && goal.currency ? goal.currency : "₦",
      savingsHistory,
    });

    return acc;
  }, []);
}

function normalizeBudgets(items) {
  return Object.values(
    items.reduce((acc, budget) => {
      const amount = Number(budget?.amount ?? budget?.budget ?? 0);

      if (!budget?.category || amount <= 0 || Number.isNaN(amount)) {
        return acc;
      }

      acc[budget.category] = {
        id: budget.id ?? `budget-${budget.category}`,
        category: budget.category,
        amount,
      };

      return acc;
    }, {}),
  );
}

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    return normalizeTransactions(parseStoredArray("transactions"));
  });

  const [goals, setGoals] = useState(() => {
    return normalizeGoals(parseStoredArray("goals"));
  });

  const [budgets, setBudgets] = useState(() => {
    return normalizeBudgets(parseStoredArray("budgets"));
  });

  const [investmentScenarios, setInvestmentScenarios] = useState(() => {
    return parseStoredArray("investmentScenarios");
  });

  useEffect(() => {
    localStorage.setItem(
      "investmentScenarios",
      JSON.stringify(investmentScenarios),
    );
  }, [investmentScenarios]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        setTransactions,
        budgets,
        setBudgets,
        goals,
        setGoals,
        investmentScenarios,
        setInvestmentScenarios,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
