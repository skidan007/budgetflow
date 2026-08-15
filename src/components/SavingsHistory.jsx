function SavingsHistory({ goal, onDeleteSaving }) {
  const savingsHistory = Array.isArray(goal?.savingsHistory)
    ? [...goal.savingsHistory].sort(
        (a, b) => new Date(b?.date || 0) - new Date(a?.date || 0),
      )
    : [];

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="font-semibold text-slate-900">
        Savings History
      </h3>

      {savingsHistory.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No savings recorded yet.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {savingsHistory.map((saving, index) => (
            <div
              key={saving?.id ?? index}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {goal?.currency || "₦"}
                  {Number(saving?.amount || 0).toLocaleString()}
                </p>

                <p className="text-xs text-slate-500">
                  {saving?.date || "No date"}
                </p>

                {saving?.note && (
                  <p className="mt-1 text-xs text-slate-500">
                    {saving.note}
                  </p>
                )}
              </div>

              {onDeleteSaving && (
                <button
                  type="button"
                  onClick={() =>
                    onDeleteSaving(goal.id, saving.id)
                  }
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavingsHistory;