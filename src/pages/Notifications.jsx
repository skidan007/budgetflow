import { Bell } from "lucide-react";

function Notifications() {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stay up to date with your BudgetFlow activity.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Bell size={28} />
        </div>

        <p className="mt-4 font-semibold text-slate-900">
          No new notifications.
        </p>

        <p className="mt-1 max-w-sm text-sm text-slate-500">
          We'll let you know here when there's something worth telling you
          about, like budget alerts or goal milestones.
        </p>
      </div>
    </section>
  );
}

export default Notifications;
