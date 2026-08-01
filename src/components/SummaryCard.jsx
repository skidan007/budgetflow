const SummaryCard = ({
  title,
  amount,
  icon: Icon,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
}) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className={iconColor} size={24} />
      </div>

      <h3 className="text-sm font-medium text-slate-500">
        {title}
      </h3>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {amount}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        Updated today
      </p>
    </div>
  );
};

export default SummaryCard;