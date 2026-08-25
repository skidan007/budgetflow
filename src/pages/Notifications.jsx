import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

import { useNotifications } from "../context/NotificationContext";
import { formatNotificationTime, NotificationIcon } from "../components/NotificationIcon";

function Notifications() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("all");
  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => filter === "all" || !notification.read),
    [notifications, filter],
  );

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Unable to update notifications. Please try again.");
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stay updated with your financial progress.
        </p>
        </div>
        {notifications.some((notification) => !notification.read) && (
          <button type="button" onClick={handleMarkAllAsRead} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-slate-600 dark:text-indigo-300 dark:hover:bg-indigo-950/40">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[["all", "All"], ["unread", "Unread"]].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${filter === value ? "border-indigo-600 text-indigo-700 dark:text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
            {label}{value === "unread" && ` (${notifications.filter((notification) => !notification.read).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-md">Loading notifications…</div>
      ) : filteredNotifications.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Bell size={28} />
        </div>

        <p className="mt-4 font-semibold text-slate-900">
          {filter === "unread" ? "No unread notifications." : "No notifications yet."}
        </p>

        <p className="mt-1 max-w-sm text-sm text-slate-500">
          We'll let you know here when your budgets or savings goals reach an important milestone.
        </p>
      </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          {filteredNotifications.map((notification) => (
            <button key={notification.id} type="button" onClick={async () => {
              if (notification.read) return;
              try { await markAsRead(notification.id); } catch { toast.error("Unable to mark notification as read."); }
            }} className={`flex w-full gap-4 border-b border-slate-100 p-4 text-left last:border-b-0 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 sm:p-5 ${!notification.read ? "bg-indigo-50 dark:bg-indigo-950/40" : ""}`}>
              <NotificationIcon type={notification.type} size={19} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{notification.title}</span>
                  {!notification.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600" aria-label="Unread" />}
                </span>
                <span className="mt-1 block text-sm text-slate-600">{notification.message}</span>
                <span className="mt-2 block text-xs text-slate-400">{formatNotificationTime(notification.created_at)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;
