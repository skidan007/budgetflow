import { createContext, useContext, useEffect, useState } from "react";

const FinanceContext = createContext();

const currencyMap = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
};

// -------------------------------------
// MONTH HELPERS
// -------------------------------------

function getCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function getMonthLabel(month) {
  if (!month) return "";

  const [year, monthNumber] = month.split("-");

  const date = new Date(
    Number(year),
    Number(monthNumber) - 1,
    1,
  );

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

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

// -------------------------------------
// TRANSACTIONS
// -------------------------------------

function normalizeTransactions(items) {
  return items.reduce((acc, transaction, index) => {
    if (!transaction || typeof transaction !== "object") {
      return acc;
    }

    const type =
      transaction.type === "Income"
        ? "Income"
        : transaction.type === "Expense"
          ? "Expense"
          : null;

    const category =
      typeof transaction.category === "string"
        ? transaction.category.trim()
        : "";

    const amount = Number(transaction.amount);

    const date =
      typeof transaction.date === "string" && transaction.date
        ? transaction.date
        : new Date().toISOString().split("T")[0];

    const currency =
      typeof transaction.currency === "string" && transaction.currency
        ? transaction.currency
        : "NGN";

    if (!type || !category || Number.isNaN(amount)) {
      return acc;
    }

    acc.push({
      id: transaction.id ?? `transaction-${index}`,
      type,
      category,
      amount,
      date,
      currency,

      // NEW
      month:
        typeof transaction.month === "string" && transaction.month
          ? transaction.month
          : getCurrentMonth(),
    });

    return acc;
  }, []);
}

// -------------------------------------
// GOALS
// -------------------------------------

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

      type:
        typeof goal.type === "string" && goal.type
          ? goal.type
          : "🎯 Goal",

      targetAmount,

      currentAmount: Number.isNaN(currentAmount) ? 0 : currentAmount,

      targetDate:
        typeof goal.targetDate === "string"
          ? goal.targetDate
          : "",

      currency:
        typeof goal.currency === "string" && goal.currency
          ? goal.currency
          : "NGN",

      savingsHistory,
    });

    return acc;
  }, []);
}

// -------------------------------------
// BUDGETS
// -------------------------------------

function normalizeBudgets(items) {
  const currentMonth = getCurrentMonth();

  return Object.values(
    items.reduce((acc, budget) => {
      const amount = Number(
        budget?.amount ?? budget?.budget ?? 0,
      );

      const category =
        typeof budget?.category === "string"
          ? budget.category.trim()
          : "";

      const currency =
        typeof budget?.currency === "string" &&
        budget.currency
          ? budget.currency
          : "NGN";

      // OLD budgets without a month are assigned
      // to the current month.
      const month =
        typeof budget?.month === "string" &&
        budget.month
          ? budget.month
          : currentMonth;

      if (
        !category ||
        amount <= 0 ||
        Number.isNaN(amount)
      ) {
        return acc;
      }

      const budgetKey = `${category}::${currency}::${month}`;

      acc[budgetKey] = {
        id:
          budget.id ??
          `budget-${budgetKey}`,

        category,

        amount,

        currency,

        month,
      };

      return acc;
    }, {}),
  );
}

// -------------------------------------
// PROVIDER
// -------------------------------------

export function FinanceProvider({ children }) {
  // -----------------------------
  // CURRENT MONTH
  // -----------------------------

  const [currentMonth, setCurrentMonth] = useState(
    getCurrentMonth(),
  );

  // Check periodically so the app notices
  // when the calendar month changes.
  useEffect(() => {
    const checkMonth = () => {
      const newMonth = getCurrentMonth();

      if (newMonth !== currentMonth) {
        setCurrentMonth(newMonth);
      }
    };

    checkMonth();

    const interval = setInterval(
      checkMonth,
      60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [currentMonth]);

  const currentMonthLabel =
    getMonthLabel(currentMonth);

    

  // -----------------------------
  // CURRENCY
  // -----------------------------

  const [defaultCurrency, setDefaultCurrency] =
    useState(
      () =>
        localStorage.getItem("defaultCurrency") ||
        "NGN",
    );

  const currencySymbol =
    currencyMap[defaultCurrency] || "₦";

  // -----------------------------
  // THEME
  // -----------------------------

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") ||
      "system",
  );

  // -----------------------------
  // TRANSACTIONS
  // -----------------------------

  const [transactions, setTransactions] =
    useState(() => {
      return normalizeTransactions(
        parseStoredArray("transactions"),
      );
    });

  // -----------------------------
  // GOALS
  // -----------------------------

  const [goals, setGoals] = useState(() => {
    return normalizeGoals(
      parseStoredArray("goals"),
    );
  });

  // -----------------------------
  // BUDGETS
  // -----------------------------

  const [budgets, setBudgets] = useState(() => {
    return normalizeBudgets(
      parseStoredArray("budgets"),
    );
  });

  // -----------------------------
  // INVESTMENTS
  // -----------------------------

  const [
    investmentScenarios,
    setInvestmentScenarios,
  ] = useState(() => {
    return parseStoredArray(
      "investmentScenarios",
    );
  });

  // -----------------------------
  // SAVE TO LOCAL STORAGE
  // -----------------------------

  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions),
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "goals",
      JSON.stringify(goals),
    );
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(
      "budgets",
      JSON.stringify(budgets),
    );
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(
      "investmentScenarios",
      JSON.stringify(
        investmentScenarios,
      ),
    );
  }, [investmentScenarios]);

  useEffect(() => {
    localStorage.setItem(
      "defaultCurrency",
      defaultCurrency,
    );
  }, [defaultCurrency]);

  // -----------------------------
  // THEME EFFECT
  // -----------------------------

  useEffect(() => {
    localStorage.setItem(
      "theme",
      theme,
    );

    const root =
      document.documentElement;

    const body =
      document.body;

    const applyTheme = (isDark) => {
      root.classList.toggle(
        "dark",
        isDark,
      );

      body.classList.toggle(
        "dark",
        isDark,
      );
    };

    if (theme === "dark") {
      applyTheme(true);
      return;
    }

    if (theme === "light") {
      applyTheme(false);
      return;
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)",
      );

    applyTheme(mediaQuery.matches);

    const handleChange = (event) => {
      applyTheme(
        event.matches,
      );
    };

    mediaQuery.addEventListener(
      "change",
      handleChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange,
      );
    };
  }, [theme]);

  // -----------------------------
  // PROVIDER
  // -----------------------------

  return (
    <FinanceContext.Provider
      value={{
        // Transactions
        transactions,
        setTransactions,

        // Goals
        goals,
        setGoals,

        // Budgets
        budgets,
        setBudgets,

        // Investments
        investmentScenarios,
        setInvestmentScenarios,

        // Currency
        defaultCurrency,
        setDefaultCurrency,
        currencySymbol,

        // Theme
        theme,
        setTheme,

        // Monthly budget system
        currentMonth,
        currentMonthLabel,
        getMonthLabel,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}