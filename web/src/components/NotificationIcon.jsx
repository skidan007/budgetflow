import { AlertCircle, AlertTriangle, Bell, CheckCircle, PiggyBank, Trophy } from "lucide-react";

const iconByType = {
  budget_warning: AlertTriangle,
  budget_exceeded: AlertCircle,
  savings_progress: PiggyBank,
  savings_goal: CheckCircle,
  achievement: Trophy,
  monthly_summary: PiggyBank,
  reminder: Bell,
};

const colorByType = {
  budget_warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  budget_exceeded: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  savings_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  savings_goal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  achievement: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300",
};

export function NotificationIcon({ type, size = 18 }) {
  const Icon = iconByType[type] || Bell;
  return <span  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
      colorByType[type] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    }`}><Icon size={size} aria-hidden="true" /></span>;
}

export function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const difference = Date.now() - date.getTime();
  if (difference < 60_000) return "Just now";
  if (difference < 3_600_000) return `${Math.floor(difference / 60_000)}m ago`;
  if (difference < 86_400_000) return `${Math.floor(difference / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}
