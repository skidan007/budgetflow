function InvestmentScenarioCard({
  scenario,
  onOpen,
  onDelete,
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">

      <h3 className="text-xl font-bold">
        {scenario.title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {new Date(scenario.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-5 space-y-2">

        <p>
          <strong>Future Value:</strong>{" "}
          {scenario.currency}
          {scenario.futureValue.toLocaleString(undefined,{
            maximumFractionDigits:2,
          })}
        </p>

        <p>
          <strong>Interest Earned:</strong>{" "}
          {scenario.currency}
          {scenario.interestEarned.toLocaleString(undefined,{
            maximumFractionDigits:2,
          })}
        </p>

      </div>

      <div className="mt-6 flex gap-3">

        <button
          onClick={() => onOpen(scenario)}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700"
        >
          Open
        </button>

        <button
          onClick={() => onDelete(scenario.id)}
          className="flex-1 rounded-lg bg-red-600 py-2 text-white hover:bg-red-700"
        >
          Delete
        </button>

      </div>

    </div>
  );
}

export default InvestmentScenarioCard;