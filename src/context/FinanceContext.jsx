import { createContext, useContext, useEffect, useState } from "react";


const FinanceContext = createContext();

function parseStoredArray(key) {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) return [];

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function normalizeBudgets(items) {
  return Object.values(
    items.reduce((acc, budget) => {
      const amount = Number(budget?.amount ?? budget?.budget ?? 0);

      if (!budget?.category || amount <= 0 || Number.isNaN(amount)) {
        return acc;
      }

      acc[budget.category] = {
        id: budget.id ?? Date.now() + Math.random(),
        category: budget.category,
        amount,
      };

      return acc;
    }, {}),
  );
}

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    return parseStoredArray("transactions");
  });
  const [goals, setGoals] = useState(() => {
    return parseStoredArray("goals");
  });

  const [budgets, setBudgets] = useState(() => {
    return normalizeBudgets(parseStoredArray("budgets"));
  });

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
      value={{ transactions, setTransactions, budgets, setBudgets, goals, setGoals }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
