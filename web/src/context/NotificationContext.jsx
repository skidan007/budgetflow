import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useFinance } from "./FinanceContext";
import { supabase } from "../lib/supabaseClient";

const NotificationContext = createContext(null);

const formatAmount = (amount, currency) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const getMonthFromDate = (date) => date?.slice(0, 7) || "";

function buildNotifications({ budgets, transactions, goals, currentMonth }) {
  const events = [];

  budgets.forEach((budget) => {
    const month = budget.month || currentMonth;
    const currency = budget.currency || "NGN";
    const amount = Number(budget.amount || 0);
    if (!amount || month !== currentMonth) return;

    const spent = transactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          transaction.category === budget.category &&
          (transaction.currency || "NGN") === currency &&
          getMonthFromDate(transaction.month || transaction.date) === month,
      )
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

    const percent = (spent / amount) * 100;
    const baseMetadata = { budget_id: budget.id, category: budget.category, month, spent, amount, currency };
    if (percent >= 100) {
      events.push({
        type: "budget_exceeded",
        title: `${budget.category} budget exceeded`,
        message: `You have exceeded your ${budget.category} budget by ${formatAmount(spent - amount, currency)}.`,
        event_key: `budget-exceeded-${budget.id}-${month}`,
        metadata: baseMetadata,
      });
    } else if (percent >= 80) {
      events.push({
        type: "budget_warning",
        title: `${budget.category} budget almost used`,
        message: `You've used ${Math.round(percent)}% of your ${budget.category} budget. ${formatAmount(amount - spent, currency)} remains.`,
        event_key: `budget-warning-${budget.id}-${month}`,
        metadata: baseMetadata,
      });
    }
  });

  goals.forEach((goal) => {
    const target = Number(goal.targetAmount || 0);
    const saved = Number(goal.currentAmount || 0);
    const currency = goal.currency || "NGN";
    if (!target || saved <= 0) return;

    const percent = Math.min((saved / target) * 100, 100);
    const metadata = { goal_id: goal.id, goal_name: goal.name, target, saved, currency };
    if (saved >= target) {
      events.push({
        type: "savings_goal",
        title: "Savings goal completed 🎉",
        message: `You've reached your ${formatAmount(target, currency)} savings goal${goal.name ? ` for ${goal.name}` : ""}.`,
        event_key: `savings-goal-${goal.id}`,
        metadata,
      });
    } else if (percent >= 25) {
      const milestone = Math.floor(percent / 25) * 25;
      events.push({
        type: "savings_progress",
        title: `You're ${Math.round(percent)}% toward your goal 🎯`,
        message: `You're getting closer to reaching your ${formatAmount(target, currency)} savings goal${goal.name ? ` for ${goal.name}` : ""}.`,
        event_key: `savings-progress-${goal.id}-${milestone}`,
        metadata,
      });
    }
  });

  const monthlySavings = goals.reduce((totals, goal) => {
    const currency = goal.currency || "NGN";
    const total = (goal.savingsHistory || [])
      .filter((saving) => getMonthFromDate(saving.date) === currentMonth)
      .reduce((sum, saving) => sum + Number(saving.amount || 0), 0);
    if (total) totals[currency] = (totals[currency] || 0) + total;
    return totals;
  }, {});

  Object.entries(monthlySavings).forEach(([currency, amount]) => {
    events.push({
      type: "achievement",
      title: `You've saved ${formatAmount(amount, currency)} this month`,
      message: "Your goal contributions this month are building your financial future.",
      event_key: `monthly-savings-${currentMonth}-${currency}`,
      metadata: { month: currentMonth, amount, currency },
    });
  });

  return events;
}

export function NotificationProvider({ children }) {
  const { user, budgets, transactions, goals, currentMonth } = useFinance();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Load notifications error:", error);
    else setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user) return;
    const generated = buildNotifications({ budgets, transactions, goals, currentMonth });
    if (!generated.length) return;

    const saveGeneratedNotifications = async () => {
      const rows = generated.map((notification) => ({ ...notification, user_id: user.id }));
      const { error } = await supabase
        .from("notifications")
        .upsert(rows, { onConflict: "user_id,event_key", ignoreDuplicates: true });
      if (error) {
        console.error("Generate notifications error:", error);
        return;
      }
      await loadNotifications();
    };
    saveGeneratedNotifications();
  }, [user, budgets, transactions, goals, currentMonth, loadNotifications]);

  const markAsRead = useCallback(async (id) => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) throw error;
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }, [user]);

  const value = useMemo(() => ({
    notifications,
    loading,
    unreadCount: notifications.filter((notification) => !notification.read).length,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications,
  }), [notifications, loading, markAsRead, markAllAsRead, loadNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider.");
  return context;
}
