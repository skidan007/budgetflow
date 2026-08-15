import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";

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

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthLabel(month) {
  if (!month) return "";

  const [year, monthNumber] = month.split("-");

  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// -------------------------------------
// LOCAL STORAGE HELPERS
// -------------------------------------

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

// True when Supabase rejected a write because the table has no such column.
function isMissingColumnError(error, columnName) {
  if (!error) return false;

  return (
    error.code === "PGRST204" ||
    (typeof error.message === "string" &&
      error.message.includes(`'${columnName}'`))
  );
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

      month:
        typeof transaction.month === "string" && transaction.month
          ? transaction.month
          : date.slice(0, 7) || getCurrentMonth(),
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

      type: typeof goal.type === "string" && goal.type ? goal.type : "🎯 Goal",

      targetAmount,

      currentAmount: Number.isNaN(currentAmount) ? 0 : currentAmount,

      targetDate: typeof goal.targetDate === "string" ? goal.targetDate : "",

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
      const amount = Number(budget?.amount ?? budget?.budget ?? 0);

      const category =
        typeof budget?.category === "string" ? budget.category.trim() : "";

      const currency =
        typeof budget?.currency === "string" && budget.currency
          ? budget.currency
          : "NGN";

      const month =
        typeof budget?.month === "string" && budget.month
          ? budget.month
          : currentMonth;

      if (!category || amount <= 0 || Number.isNaN(amount)) {
        return acc;
      }

      const budgetKey = `${category}::${currency}::${month}`;

      acc[budgetKey] = {
        id: budget.id ?? `budget-${budgetKey}`,

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
  // -----------------------------------
  // AUTHENTICATED USER
  // -----------------------------------

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  // -----------------------------------
  // CURRENT MONTH
  // -----------------------------------

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    const checkMonth = () => {
      const newMonth = getCurrentMonth();

      if (newMonth !== currentMonth) {
        setCurrentMonth(newMonth);
      }
    };

    checkMonth();

    const interval = setInterval(checkMonth, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentMonth]);

  const currentMonthLabel = getMonthLabel(currentMonth);

  // -----------------------------------
  // CURRENCY
  // -----------------------------------

  const [defaultCurrency, setDefaultCurrency] = useState(
    () => localStorage.getItem("defaultCurrency") || "NGN",
  );

  const currencySymbol = currencyMap[defaultCurrency] || "₦";

  // -----------------------------------
  // THEME
  // -----------------------------------

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system",
  );

  // -----------------------------------
  // TRANSACTIONS
  // -----------------------------------

  const [transactions, setTransactions] = useState(() => {
    return normalizeTransactions(parseStoredArray("transactions"));
  });

  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // -----------------------------------
  // GOALS
  // -----------------------------------

  const [goals, setGoals] = useState(() => {
    return normalizeGoals(parseStoredArray("goals"));
  });

  // -----------------------------------
  // BUDGETS
  // -----------------------------------

  const [budgets, setBudgets] = useState(() => {
    return normalizeBudgets(parseStoredArray("budgets"));
  });

  // -----------------------------------
  // INVESTMENTS
  // -----------------------------------

  const [investmentScenarios, setInvestmentScenarios] = useState(() => {
    return parseStoredArray("investmentScenarios");
  });

  // -----------------------------------
  // AUTH LISTENER
  // -----------------------------------

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("FinanceContext user error:", error);
      }

      if (!mounted) return;

      setUser(user ?? null);
      setAuthLoading(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // -----------------------------------
  // LOAD TRANSACTIONS FROM SUPABASE
  // -----------------------------------

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTransactions([]);
      setTransactionsLoading(false);
      return;
    }

    const loadTransactions = async () => {
      setTransactionsLoading(true);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", {
          ascending: false,
        });

      if (error) {
        console.error("Load transactions error:", error);

        setTransactionsLoading(false);
        return;
      }

      setTransactions(normalizeTransactions(data ?? []));

      setTransactionsLoading(false);
    };

    loadTransactions();
  }, [user, authLoading]);

  // -----------------------------------
  // ADD TRANSACTION
  // -----------------------------------

  const addTransaction = async (transaction) => {
    if (!user) {
      throw new Error("You must be logged in to add a transaction.");
    }

    const date = transaction.date || new Date().toISOString().split("T")[0];

    const month = transaction.month || date.slice(0, 7);

    const newTransaction = {
      type: transaction.type,
      category: transaction.category.trim(),
      amount: Number(transaction.amount),
      date,
      currency: transaction.currency || defaultCurrency,
      month,
      user_id: user.id,
    };

    let { data, error } = await supabase
      .from("transactions")
      .insert(newTransaction)
      .select()
      .single();

    // Older tables may not have a "month" column yet; it can
    // always be derived from "date", so retry without it.
    if (isMissingColumnError(error, "month")) {
      const withoutMonth = { ...newTransaction };
      delete withoutMonth.month;

      ({ data, error } = await supabase
        .from("transactions")
        .insert(withoutMonth)
        .select()
        .single());
    }

    if (error) {
      console.error("Add transaction error:", error);

      throw error;
    }

    const normalized = normalizeTransactions([data])[0];

    setTransactions((prev) => [normalized, ...prev]);

    return normalized;
  };

  // -----------------------------------
  // UPDATE TRANSACTION
  // -----------------------------------

  const updateTransaction = async (id, updates) => {
    if (!user) {
      throw new Error("You must be logged in.");
    }

    const cleanUpdates = {
      ...updates,
    };

    if (cleanUpdates.amount !== undefined) {
      cleanUpdates.amount = Number(cleanUpdates.amount);
    }

    if (cleanUpdates.category !== undefined) {
      cleanUpdates.category = cleanUpdates.category.trim();
    }

    let { data, error } = await supabase
      .from("transactions")
      .update(cleanUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    // Older tables may not have a "month" column yet; it can
    // always be derived from "date", so retry without it.
    if (isMissingColumnError(error, "month")) {
      const withoutMonth = { ...cleanUpdates };
      delete withoutMonth.month;

      ({ data, error } = await supabase
        .from("transactions")
        .update(withoutMonth)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single());
    }

    if (error) {
      console.error("Update transaction error:", error);

      throw error;
    }

    const normalized = normalizeTransactions([data])[0];

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? normalized : transaction,
      ),
    );

    return normalized;
  };

  // -----------------------------------
  // DELETE TRANSACTION
  // -----------------------------------

  const deleteTransaction = async (id) => {
    if (!user) {
      throw new Error("You must be logged in.");
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete transaction error:", error);

      throw error;
    }

    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id),
    );
  };

  // -------------------------------------
  // ADD BUDGET
  // -------------------------------------

  const addBudget = async (budget) => {
    if (!user) {
      throw new Error("You must be logged in to add a budget.");
    }

    const category =
      typeof budget.category === "string" ? budget.category.trim() : "";

    const amount = Number(budget.amount);

    if (!category || Number.isNaN(amount) || amount <= 0) {
      throw new Error("Invalid budget information.");
    }

    const newBudget = {
      category,
      amount,
      currency: budget.currency || defaultCurrency,
      month: budget.month || currentMonth,
      user_id: user.id,
    };

    let { data, error } = await supabase
      .from("budgets")
      .insert(newBudget)
      .select()
      .single();

    // Support older tables that may not have month yet.
    if (isMissingColumnError(error, "month")) {
      const withoutMonth = {
        ...newBudget,
      };

      delete withoutMonth.month;

      ({ data, error } = await supabase
        .from("budgets")
        .insert(withoutMonth)
        .select()
        .single());
    }

    if (error) {
      console.error("Add budget error:", error);
      throw error;
    }

    const normalized = normalizeBudgets([data])[0];

    setBudgets((prev) => [...prev, normalized]);

    return normalized;
  };

  // -------------------------------------
  // ADD GOAL
  // -------------------------------------

  const addGoal = async (goal) => {
    if (!user) {
      throw new Error("You must be logged in to add a goal.");
    }

    const name = typeof goal.name === "string" ? goal.name.trim() : "";

    const targetAmount = Number(goal.targetAmount);

    if (!name || Number.isNaN(targetAmount) || targetAmount <= 0) {
      throw new Error("Invalid goal information.");
    }

    const newGoal = {
      name,
      type: goal.type || "🎯 Goal",

      target_amount: targetAmount,

      current_amount: Number(goal.currentAmount || 0),

      target_date: goal.targetDate || null,

      currency: goal.currency || defaultCurrency,

      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("goals")
      .insert(newGoal)
      .select()
      .single();

    if (error) {
      console.error("Add goal error:", error);
      throw error;
    }

    const normalized = normalizeGoals([
      {
        ...data,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        targetDate: data.target_date,
      },
    ])[0];

    setGoals((prev) => [...prev, normalized]);

    return normalized;
  };

  // -----------------------------------
  // LOCAL STORAGE
  // -----------------------------------

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(
      "investmentScenarios",
      JSON.stringify(investmentScenarios),
    );
  }, [investmentScenarios]);

  useEffect(() => {
    localStorage.setItem("defaultCurrency", defaultCurrency);
  }, [defaultCurrency]);

  // -----------------------------------
  // THEME EFFECT
  // -----------------------------------

  useEffect(() => {
    localStorage.setItem("theme", theme);

    const root = document.documentElement;

    const body = document.body;

    const applyTheme = (isDark) => {
      root.classList.toggle("dark", isDark);

      body.classList.toggle("dark", isDark);
    };

    if (theme === "dark") {
      applyTheme(true);
      return;
    }

    if (theme === "light") {
      applyTheme(false);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    applyTheme(mediaQuery.matches);

    const handleChange = (event) => {
      applyTheme(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  // -----------------------------------
  // PROVIDER
  // -----------------------------------

  return (
    <FinanceContext.Provider
      value={{
        // Transactions
        transactions,
        setTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transactionsLoading,

        // Goals
        goals,
        setGoals,
        addGoal,

        // Budgets
        budgets,
        setBudgets,
        addBudget,

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

        // User
        user,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
