const SummaryCard = ({ title, amount, icon: Icon }) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <Icon className="mb-4 text-blue" size="28" />

      <h3 className="text-sm text-slate-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{amount}</p>
    </div>
  );
};

export default SummaryCard;
