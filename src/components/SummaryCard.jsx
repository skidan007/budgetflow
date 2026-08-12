const SummaryCard = ({
  title,
  amount,
  icon: Icon,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
  currency = "₦",
}) => {
  const parsedAmount =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^0-9.-]/g, ""));

  const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const isNegative = safeAmount < 0;

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-md ring-1 ring-slate-100 sm:p-6">
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
            isNegative ? "text-red-600" : "text-slate-900"
          }`}
        >
          {currency}
          {safeAmount.toLocaleString()}
        </p>

        <p className="text-xs text-slate-400">Updated today</p>
      </div>
    </div>
  );
};

export default SummaryCard;
