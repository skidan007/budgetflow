const SummaryCard = ({
  title,
  amount,
  icon: Icon,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
  currency = "₦",
  updatedAt,
}) => {
  const parsedAmount =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^0-9.-]/g, ""));

  const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const isNegative = safeAmount < 0;
  const parsedUpdatedAt = updatedAt
    ? new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(updatedAt)
          ? `${updatedAt}T00:00:00`
          : updatedAt,
      )
    : null;
  const updateLabel = (() => {
    if (!parsedUpdatedAt || !Number.isFinite(parsedUpdatedAt.getTime())) {
      return null;
    }

    const now = new Date();
    const updatedDay = Date.UTC(
      parsedUpdatedAt.getFullYear(),
      parsedUpdatedAt.getMonth(),
      parsedUpdatedAt.getDate(),
    );
    const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysAgo = Math.floor((currentDay - updatedDay) / 86_400_000);

    if (daysAgo <= 0) return "Updated today";
    if (daysAgo === 1) return "Updated yesterday";
    if (daysAgo < 7) {
      return `Updated ${parsedUpdatedAt
        .toLocaleDateString(undefined, { weekday: "long" })
        .toLowerCase()}`;
    }

    return "Updated last week";
  })();

  return (
    <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        {Icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <Icon className={`${iconColor} shrink-0`} size={22} />
          </div>
        )}

        <h3 className="text-sm font-medium leading-none text-slate-500">{title}</h3>
      </div>

      <div className="space-y-2">
        <p
          className={`text-xl font-bold tracking-tight sm:text-[1.4rem] ${
            isNegative ? "text-red-600 dark:text-red-300" : "text-slate-950 dark:text-slate-50"
          }`}
        >
          {currency}
          {safeAmount.toLocaleString()}
        </p>

        {updateLabel && <p className="text-xs text-slate-400">{updateLabel}</p>}
      </div>
    </div>
  );
};

export default SummaryCard;
