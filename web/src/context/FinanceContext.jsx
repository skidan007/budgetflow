import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

function getPreviousMonth(month) {
  const [year, monthNumber] = String(month || "").split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

function normalizeBudgetMonth(month, fallback = getCurrentMonth()) {
  return /^\d{4}-\d{2}$/.test(String(month || "")) ? month : fallback;
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

    // Older transactions were created before this field existed.
    const description =
      typeof transaction.description === "string"
        ? transaction.description.trim()
        : "";

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
      description,
      updated_at:
        typeof transaction.updated_at === "string" && transaction.updated_at
          ? transaction.updated_at
          : typeof transaction.created_at === "string"
            ? transaction.created_at
            : null,

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

            note: typeof saving.note === "string" ? saving.note : "",
            updatedAt:
              typeof saving.updatedAt === "string" && saving.updatedAt
                ? saving.updatedAt
                : null,
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
      savingsUpdatedAtByMonth:
        goal.savingsUpdatedAtByMonth &&
        typeof goal.savingsUpdatedAtByMonth === "object"
          ? goal.savingsUpdatedAtByMonth
          : {},
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

      const month = normalizeBudgetMonth(budget?.month, currentMonth);

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

  const [transactions, setTransactions] = useState([]);

  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // -----------------------------------
  // GOALS
  // -----------------------------------

  const [goals, setGoals] = useState(() => {
    return [];
  });
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState(null);
  const [goalsReloadKey, setGoalsReloadKey] = useState(0);
  const refreshGoals = useCallback(() => setGoalsReloadKey((key) => key + 1), []);

  // -----------------------------------
  // BUDGETS
  // -----------------------------------

  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  // The rollover record is the cross-device source of truth for the prior cycle.
  const [financialCycle, setFinancialCycle] = useState(null);
  const [financialCycleLoading, setFinancialCycleLoading] = useState(true);
  const [financialCycleError, setFinancialCycleError] = useState(null);

  // -----------------------------------
  // FINANCIAL PROFILE
  // -----------------------------------

  const [financialProfile, setFinancialProfileState] = useState(null);

  const [financialProfileLoading, setFinancialProfileLoading] =
    useState(false);

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

  // Goals and their contribution history are shared records in Supabase.
  // The old browser-only goals array is imported once for its original owner.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    if (!user) {
      setGoals([]);
      setGoalsError(null);
      setGoalsLoading(false);
      return () => { cancelled = true; };
    }

    const loadGoals = async () => {
      setGoalsLoading(true);
      setGoalsError(null);
      try {
        const { data: remoteData, error: remoteError } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);
        if (remoteError) throw remoteError;
        let remoteGoals = remoteData ?? [];

        const migrationKey = `goalsMigrated:${user.id}`;
        const legacyOwner = localStorage.getItem("goalsOwnerUserId");
        const mayMigrateLegacy = !legacyOwner || legacyOwner === user.id;
        if (mayMigrateLegacy && localStorage.getItem(migrationKey) !== "true") {
          const legacyGoals = normalizeGoals(parseStoredArray("goals"));
          const legacyContributions = [];

          for (const legacyGoal of legacyGoals) {
            const legacyKey = `web-local:${legacyGoal.id}`;
            let remoteGoal = remoteGoals.find((item) =>
              String(item.id) === String(legacyGoal.id),
            );

            if (!remoteGoal) {
              remoteGoal = remoteGoals.find((item) =>
                item.legacy_key === legacyKey || (
                  item.name?.trim().toLocaleLowerCase() === legacyGoal.name.toLocaleLowerCase() &&
                  (item.currency || "NGN") === (legacyGoal.currency || "NGN")
                ),
              );
            }

            if (!remoteGoal) {
              let { data, error } = await supabase.from("goals").insert({
                user_id: user.id,
                legacy_key: legacyKey,
                name: legacyGoal.name,
                type: legacyGoal.type,
                target_amount: legacyGoal.targetAmount,
                current_amount: legacyGoal.currentAmount,
                target_date: legacyGoal.targetDate || null,
                currency: legacyGoal.currency || "NGN",
              }).select().single();
              if (error?.code === "23505") {
                const existing = await supabase.from("goals").select("*")
                  .eq("user_id", user.id).eq("legacy_key", legacyKey).maybeSingle();
                if (existing.error) throw existing.error;
                data = existing.data;
                error = null;
              }
              if (error) throw error;
              remoteGoal = data;
              if (data && !remoteGoals.some((item) => item.id === data.id)) {
                remoteGoals = [...remoteGoals, data];
              }
            }

            (legacyGoal.savingsHistory || []).forEach((saving, index) => {
              if (Number(saving.amount) > 0) {
                legacyContributions.push({
                  goal_id: remoteGoal.id,
                  user_id: user.id,
                  amount: Number(saving.amount),
                  date: saving.date || new Date().toISOString().slice(0, 10),
                  note: saving.note || "",
                  source_key: `legacy-web:${saving.id ?? `${legacyGoal.id}-${index}`}`,
                });
              }
            });
          }

          if (legacyContributions.length) {
            const { error } = await supabase.from("goal_contributions").upsert(
              legacyContributions,
              { onConflict: "goal_id,source_key", ignoreDuplicates: true },
            );
            if (error) throw error;
          }

          if (cancelled) return;
          if (mayMigrateLegacy) {
            localStorage.setItem("goalsOwnerUserId", user.id);
            localStorage.removeItem("goals");
          }
          localStorage.setItem(migrationKey, "true");
        }

        const { data: contributionRows, error: contributionError } = await supabase
          .from("goal_contributions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });
        if (contributionError) throw contributionError;
        if (cancelled) return;

        const contributionMap = (contributionRows ?? []).reduce((map, row) => {
          (map[row.goal_id] ||= []).push({
            id: row.id,
            amount: Number(row.amount),
            date: row.date,
            note: row.note || "",
            updatedAt: row.updated_at || row.created_at || null,
          });
          return map;
        }, {});

        setGoals(normalizeGoals(remoteGoals.map((goal) => ({
          ...goal,
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount,
          targetDate: goal.target_date,
          savingsHistory: contributionMap[goal.id] || [],
          savingsUpdatedAtByMonth: (contributionMap[goal.id] || []).reduce((months, saving) => {
            const month = saving.date?.slice(0, 7);
            if (month && saving.updatedAt && (!months[month] || saving.updatedAt > months[month])) {
              months[month] = saving.updatedAt;
            }
            return months;
          }, {}),
        }))));
      } catch (error) {
        console.error("Load goals error:", error);
        if (!cancelled) setGoalsError(error);
      } finally {
        if (!cancelled) setGoalsLoading(false);
      }
    };

    loadGoals();
    return () => { cancelled = true; };
  }, [user, authLoading, goalsReloadKey]);

  useEffect(() => {
    if (!user) return undefined;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshGoals();
    };
    window.addEventListener("focus", refreshGoals);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", refreshGoals);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, refreshGoals]);

  // -----------------------------------
  // LOAD CURRENT FINANCIAL CYCLE STATE
  // -----------------------------------

  const loadFinancialCycle = async () => {
    if (authLoading) return;

    if (!user) {
      setFinancialCycle(null);
      setFinancialCycleError(null);
      setFinancialCycleLoading(false);
      return;
    }

    setFinancialCycleLoading(true);
    setFinancialCycleError(null);

    const cycleMonth = getPreviousMonth(currentMonth);
    const { data, error } = await supabase
      .from("financial_cycles")
      .select("*")
      .eq("user_id", user.id)
      .eq("cycle_month", cycleMonth)
      .maybeSingle();

    if (error) {
      console.error("Load financial cycle error:", error);
      setFinancialCycle(null);
      setFinancialCycleError(error);
    } else {
      setFinancialCycle(data ?? null);
    }

    setFinancialCycleLoading(false);
  };

  useEffect(() => {
    loadFinancialCycle();
    // The loader is also exposed for the dashboard retry action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, currentMonth]);

  // -----------------------------------
  // LOAD BUDGETS FROM SUPABASE
  // -----------------------------------

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    if (!user) {
      setBudgets([]);
      setBudgetsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadBudgets = async () => {
      setBudgetsLoading(true);

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("month", { ascending: false });

      if (error) {
        console.error("Load budgets error:", error);
        if (cancelled) return;
        setBudgets([]);
        setBudgetsLoading(false);
        return;
      }

      let remoteBudgets = normalizeBudgets(data ?? []);
      if (cancelled) return;
      const legacyOwner = localStorage.getItem("budgetsOwnerUserId");
      const migrationKey = `budgetsMigrated:${user.id}`;
      const legacyBudgets = normalizeBudgets(parseStoredArray("budgets"));

      if (
        remoteBudgets.length === 0 &&
        legacyBudgets.length > 0 &&
        (!legacyOwner || legacyOwner === user.id) &&
        localStorage.getItem(migrationKey) !== "true"
      ) {
        const rows = legacyBudgets.map(({ category, amount, currency, month }) => ({
          category,
          amount,
          currency,
          month: normalizeBudgetMonth(month),
          user_id: user.id,
        }));
        const { error: migrationError } = await supabase
          .from("budgets")
          .upsert(rows, { onConflict: "user_id,category,currency,month" });

        if (migrationError) {
          console.error("Migrate local budgets error:", migrationError);
        } else {
          localStorage.setItem(migrationKey, "true");
          const { data: migratedData, error: reloadError } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)
            .order("month", { ascending: false });

          if (reloadError) console.error("Reload migrated budgets error:", reloadError);
          else remoteBudgets = normalizeBudgets(migratedData ?? []);
        }
      }

      if (cancelled) return;
      localStorage.setItem("budgetsOwnerUserId", user.id);
      setBudgets(remoteBudgets);
      setBudgetsLoading(false);
    };

    loadBudgets();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // -----------------------------------
  // LOAD FINANCIAL PROFILE FROM SUPABASE
  // -----------------------------------

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setFinancialProfileState(null);
      setFinancialProfileLoading(false);
      return;
    }

    const loadFinancialProfile = async () => {
      setFinancialProfileLoading(true);

      const { data, error } = await supabase
        .from("financial_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Load financial profile error:", error);

        setFinancialProfileLoading(false);
        return;
      }

      setFinancialProfileState(data ?? null);

      setFinancialProfileLoading(false);
    };

    loadFinancialProfile();
  }, [user, authLoading]);

  // -----------------------------------
  // SAVE FINANCIAL PROFILE
  // -----------------------------------

  const saveFinancialProfile = async (updates) => {
    if (!user) {
      throw new Error("You must be logged in to save your financial profile.");
    }

    const newProfile = {
      user_id: user.id,
      monthly_income: Number(updates.monthlyIncome) || 0,
      main_goal: updates.mainGoal || "",
      monthly_savings_target: Number(updates.monthlySavingsTarget) || 0,
      emergency_fund_target: Number(updates.emergencyFundTarget) || 0,
      budget_preference: updates.budgetPreference || "Balanced",
    };

    const { data, error } = await supabase
      .from("financial_profiles")
      .upsert(newProfile, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Save financial profile error:", error);

      throw error;
    }

    setFinancialProfileState(data);

    return data;
  };

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
      description:
        typeof transaction.description === "string"
          ? transaction.description.trim()
          : "",
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

    // Older tables may not have a "description" column yet.
    if (isMissingColumnError(error, "description")) {
      const withoutDescription = { ...newTransaction };
      delete withoutDescription.description;

      ({ data, error } = await supabase
        .from("transactions")
        .insert(withoutDescription)
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

  // Claims one cycle before applying its action so two devices cannot process it twice.
  const completeFinancialCycle = async ({
    cycleMonth,
    nextMonth,
    action,
    previousBalance,
    carriedForwardAmount = 0,
    carryForwardDescription,
    currency,
  }) => {
    if (!user) throw new Error("You must be logged in.");

    const cycle = {
      user_id: user.id,
      cycle_month: cycleMonth,
      next_month: nextMonth,
      status: "pending",
      rollover_action: action,
      previous_balance: Number(previousBalance) || 0,
      carried_forward_amount: Number(carriedForwardAmount) || 0,
    };

    let { data, error } = await supabase
      .from("financial_cycles")
      .insert(cycle)
      .select()
      .single();

    if (error?.code === "23505") {
      const existing = await supabase
        .from("financial_cycles")
        .select("*")
        .eq("user_id", user.id)
        .eq("cycle_month", cycleMonth)
        .maybeSingle();

      if (existing.error) throw existing.error;
      if (existing.data?.status === "completed") {
        setFinancialCycle(existing.data);
        return existing.data;
      }

      const pendingAge = existing.data?.updated_at
        ? Date.now() - new Date(existing.data.updated_at).getTime()
        : 0;
      if (pendingAge >= 5 * 60 * 1000) {
        const takeover = await supabase
          .from("financial_cycles")
          .update({
            ...cycle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.data.id)
          .eq("status", "pending")
          .eq("updated_at", existing.data.updated_at)
          .select()
          .maybeSingle();

        if (takeover.error) throw takeover.error;
        if (takeover.data) {
          data = takeover.data;
          error = null;
        }
      }

      if (data) {
        // The stale claim was reclaimed by this request; continue below.
      } else {
        data = existing.data;

        if (action === "carry_forward") {
          const matchingTransaction = await supabase
            .from("transactions")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "Income")
            .eq("category", "Carry Forward")
            .eq("amount", Number(carriedForwardAmount) || 0)
            .eq("date", `${nextMonth}-01`)
            .limit(1)
            .maybeSingle();

          if (matchingTransaction.error) throw matchingTransaction.error;
          if (!matchingTransaction.data) {
            throw new Error("This rollover is already being processed on another device.");
          }

          const completed = await supabase
            .from("financial_cycles")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.data.id)
            .eq("status", "pending")
            .select()
            .single();

          if (completed.error) throw completed.error;
          setFinancialCycle(completed.data);
          return completed.data;
        }

        throw new Error("This rollover is already being processed on another device.");
      }
    }

    if (error) throw error;

    if (action === "carry_forward") {
      try {
        await addTransaction({
          type: "Income",
          amount: carriedForwardAmount,
          category: "Carry Forward",
          description: carryForwardDescription,
          date: `${nextMonth}-01`,
          currency: currency || defaultCurrency,
          month: nextMonth,
        });
      } catch (transactionError) {
        await supabase.from("financial_cycles").delete().eq("id", data.id).eq("status", "pending");
        throw transactionError;
      }
    }

    const completed = await supabase
      .from("financial_cycles")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "pending")
      .select()
      .single();

    if (completed.error) throw completed.error;
    setFinancialCycle(completed.data);
    return completed.data;
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

    if (cleanUpdates.description !== undefined) {
      cleanUpdates.description = String(cleanUpdates.description).trim();
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

    // Older tables may not have a "description" column yet.
    if (isMissingColumnError(error, "description")) {
      const withoutDescription = { ...cleanUpdates };
      delete withoutDescription.description;

      ({ data, error } = await supabase
        .from("transactions")
        .update(withoutDescription)
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
      month: normalizeBudgetMonth(budget.month, currentMonth),
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("budgets")
      .upsert(newBudget, { onConflict: "user_id,category,currency,month" })
      .select()
      .single();

    if (error) {
      console.error("Add budget error:", error);
      throw error;
    }

    const normalized = normalizeBudgets([data])[0];

    setBudgets((prev) => {
      const key = `${normalized.category}::${normalized.currency}::${normalized.month}`;
      const next = prev.filter(
        (item) => `${item.category}::${item.currency}::${item.month}` !== key,
      );
      return [...next, normalized];
    });

    return normalized;
  };

  const updateBudget = async (id, updates) => {
    if (!user) throw new Error("You must be logged in.");

    const cleanUpdates = {
      ...updates,
      ...(updates.category !== undefined && {
        category: String(updates.category).trim(),
      }),
      ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
      ...(updates.month !== undefined && {
        month: normalizeBudgetMonth(updates.month, currentMonth),
      }),
    };
    delete cleanUpdates.id;
    delete cleanUpdates.user_id;

    const { data, error } = await supabase
      .from("budgets")
      .update(cleanUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Update budget error:", error);
      throw error;
    }

    const normalized = normalizeBudgets([data])[0];
    setBudgets((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? normalized : item)),
    );
    return normalized;
  };

  const deleteBudget = async (id) => {
    if (!user) throw new Error("You must be logged in.");

    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete budget error:", error);
      throw error;
    }

    setBudgets((prev) => prev.filter((item) => String(item.id) !== String(id)));
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

  // -------------------------------------
  // UPDATE GOAL
  // -------------------------------------
  const updateGoal = async (id, updates) => {
    if (!user) throw new Error("You must be logged in to update a goal.");
    const current = goals.find((goal) => String(goal.id) === String(id));
    if (!current) throw new Error("Goal not found.");
    const targetAmount = Number(updates.targetAmount ?? current.targetAmount);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) throw new Error("Enter a valid goal target amount.");
    const { data, error } = await supabase
      .from("goals")
      .update({
        name: updates.name?.trim() || current.name,
        type: updates.type || current.type,
        target_amount: targetAmount,
        target_date: updates.targetDate || null,
        currency: updates.currency || current.currency,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw error;
    const saved = {
      ...current,
      ...updates,
      id: data.id,
      name: data.name,
      type: data.type,
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount || 0),
      targetDate: data.target_date || "",
      currency: data.currency || "NGN",
    };
    setGoals((items) => items.map((goal) => String(goal.id) === String(id) ? saved : goal));
    return saved;
  };

  // -------------------------------------
  // DELETE GOAL
  // -------------------------------------

  const deleteGoal = async (id) => {
    if (!user) throw new Error("You must be logged in to delete a goal.");
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    setGoals((items) => items.filter((goal) => String(goal.id) !== String(id)));
  };

  // -------------------------------------
  // ADD SAVING TO GOAL
  // -------------------------------------

  const addSavingToGoal = async (id, saving) => {
    const amount = Number(saving?.amount);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      throw new Error("Enter a valid saving amount.");
    }

    const goal = goals.find((item) => String(item.id) === String(id));

    if (!goal) {
      throw new Error("Goal not found.");
    }

    const remaining = Number(goal.targetAmount || 0) - Number(goal.currentAmount || 0);

    if (amount > remaining) {
      throw new Error("This saving is larger than the remaining goal amount.");
    }

    const { data, error } = await supabase.rpc("add_goal_contribution", {
      p_goal_id: id,
      p_amount: amount,
      p_date: saving.date || new Date().toISOString().split("T")[0],
      p_note: saving.note || "",
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const newSaving = {
      id: row.id,
      amount: Number(row.amount),
      date: row.date,
      note: row.note || "",
      updatedAt: row.updated_at || row.created_at || null,
    };
    setGoals((items) => items.map((item) => String(item.id) === String(id)
      ? {
          ...item,
          currentAmount: Number(item.currentAmount || 0) + amount,
          savingsHistory: [newSaving, ...(item.savingsHistory || [])],
          savingsUpdatedAtByMonth: {
            ...(item.savingsUpdatedAtByMonth || {}),
            [newSaving.date.slice(0, 7)]: newSaving.updatedAt,
          },
        }
      : item));
    return newSaving;
  };

  // -------------------------------------
  // DELETE SAVING FROM GOAL
  // -------------------------------------

  const deleteSavingFromGoal = async (goalId, savingId) => {
    if (!user) throw new Error("You must be logged in to delete a contribution.");
    const goal = goals.find((item) => String(item.id) === String(goalId));
    const saving = goal?.savingsHistory?.find((item) => String(item.id) === String(savingId));
    if (!goal || !saving) throw new Error("Contribution not found.");
    const { error } = await supabase.rpc("delete_goal_contribution", {
      p_contribution_id: savingId,
    });
    if (error) throw error;
    const month = saving.date?.slice(0, 7);
    setGoals((items) => items.map((item) => String(item.id) === String(goalId)
      ? {
          ...item,
          currentAmount: Math.max(Number(item.currentAmount || 0) - Number(saving.amount || 0), 0),
          savingsHistory: item.savingsHistory.filter((entry) => String(entry.id) !== String(savingId)),
          savingsUpdatedAtByMonth: month
            ? { ...(item.savingsUpdatedAtByMonth || {}), [month]: new Date().toISOString() }
            : item.savingsUpdatedAtByMonth || {},
        }
      : item));
  };

  // -----------------------------------
  // LOCAL STORAGE
  // -----------------------------------

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
        goalsLoading,
        goalsError,
        refreshGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        addSavingToGoal,
        deleteSavingFromGoal,

        // Budgets
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        budgetsLoading,

        // Financial cycle rollover
        financialCycle,
        financialCycleLoading,
        financialCycleError,
        loadFinancialCycle,
        completeFinancialCycle,

        // Financial profile
        financialProfile,
        financialProfileLoading,
        saveFinancialProfile,

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
