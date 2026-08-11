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
    <div className="rounded-xl bg-white p-6 shadow-md grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Icon && (
        <div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}
        >
          <Icon className={iconColor} size={24} />
        </div>
      )}

      <h3 className="text-sm font-medium text-slate-500">
        {title}
      </h3>

      <p
        className={`mt-2 text-xl font-bold sm:text-2xl tracking-tight ${
          isNegative ? "text-red-600" : "text-slate-900"
        }`}
      >
        {currency}
        {safeAmount.toLocaleString()}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        Updated today
      </p>
    </div>
  );
};

export default SummaryCard;