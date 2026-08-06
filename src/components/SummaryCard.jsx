const SummaryCard = ({
  title,
  amount,
  icon: Icon,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
}) => {
  const parsedAmount =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^0-9.-]/g, ""));

  const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const isNegative = safeAmount < 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

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
        className={`mt-2 text-3xl font-bold tracking-tight ${
          isNegative ? "text-red-600" : "text-slate-900"
        }`}
      >
        ₦{safeAmount.toLocaleString()}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        Updated today
      </p>

    </div>
  );
};

export default SummaryCard;
