function ExpenseForm({
  expenseInput,
  setExpenseInput,
  expenseCategory,
  setExpenseCategory,
  expenseDate,
  setExpenseDate,
  onSubmit,
  buttonText,
  categoryOptions,
  currencySymbol,
  selectedCategoryRemaining,
  noBudgetMessage,
}) {
  const fallbackCategories = [
    "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Shopping",
    "Health",
  ];

  const categories =
    Array.isArray(categoryOptions) && categoryOptions.length > 0
      ? categoryOptions
      : fallbackCategories;

  const isBudgetMode = Array.isArray(categoryOptions);
  const disableExpenseSubmit = isBudgetMode && categoryOptions.length === 0;

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">{buttonText}</h2>

      <div className="space-y-4 w-full min-w-0">
        <select
          value={expenseCategory}
          onChange={(e) => setExpenseCategory(e.target.value)}
          disabled={disableExpenseSubmit}
          className="w-full rounded-lg border p-3"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {isBudgetMode && disableExpenseSubmit && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
            {noBudgetMessage ||
              "Create at least one budget in this currency before adding expenses."}
          </p>
        )}

        {isBudgetMode && !disableExpenseSubmit && expenseCategory && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Remaining budget for {expenseCategory}: {currencySymbol || "₦"}
            {Number(selectedCategoryRemaining || 0).toLocaleString()}
          </p>
        )}

        <input
          type="date"
          value={expenseDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="w-full min-w-0 max-w-full box-border appearance-none rounded-lg border border-slate-300 p-3"
        />

        <input
          type="number"
          placeholder="Amount"
          value={expenseInput}
          onChange={(e) => setExpenseInput(e.target.value)}
          className="w-full min-w-0 max-w-full box-border appearance-none rounded-lg border border-slate-300 p-3"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={disableExpenseSubmit}
          className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default ExpenseForm;
