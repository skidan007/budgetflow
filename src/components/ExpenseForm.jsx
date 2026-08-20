function TransactionForm({
  amount: incomingAmount,
  setAmount: setIncomingAmount,
  category: incomingCategory,
  setCategory: setIncomingCategory,
  date: incomingDate,
  setDate: setIncomingDate,
  description: incomingDescription,
  setDescription: setIncomingDescription,
  expenseInput,
  setExpenseInput,
  expenseCategory,
  setExpenseCategory,
  expenseDate,
  setExpenseDate,
  expenseDescription,
  setExpenseDescription,
  onSubmit,
  buttonText,
  categoryOptions,
  currencySymbol,
  selectedCategoryRemaining,
  noBudgetMessage,
  type = "Expense",
  categoryLabel = "Category",
  dateLabel = "Date",
  amountLabel = "Amount",
  amountPlaceholder = "Amount",
  className = "",
}) {
  const amount = incomingAmount ?? expenseInput ?? "";
  const setAmount = setIncomingAmount ?? setExpenseInput ?? (() => {});
  const category = incomingCategory ?? expenseCategory ?? "";
  const setCategory = setIncomingCategory ?? setExpenseCategory ?? (() => {});
  const date = incomingDate ?? expenseDate ?? "";
  const setDate = setIncomingDate ?? setExpenseDate ?? (() => {});
  const description = incomingDescription ?? expenseDescription ?? "";
  const setDescription =
    setIncomingDescription ?? setExpenseDescription ?? (() => {});

  const fallbackCategories =
  type === "Income"
    ? ["Salary", "Business", "Investment", "Gift", "Other"]
    : [
        "Food",
        "Transport",
        "Bills",
        "Data & Airtime",
        "Rent",
        "Entertainment",
        "Shopping",
        "Health",
        "Education",
        "Personal",
        "Other",
      ];

  const categories = Array.isArray(categoryOptions)
    ? categoryOptions
    : fallbackCategories;

  const isBudgetMode = Array.isArray(categoryOptions);
  const disableSubmit = isBudgetMode && categoryOptions.length === 0;
  const isDateSelected = Boolean(date);

  const accentClasses =
    type === "Income"
      ? {
          badge: "bg-green-100 text-green-600",
          button: "bg-green-600 hover:bg-green-700",
          focus: "focus:border-green-500",
          select: "border-slate-300",
        }
      : {
          badge: "bg-red-100 text-red-600",
          button: "bg-red-600 hover:bg-red-700",
          focus: "focus:border-red-500",
          select: "border-slate-300",
        };

  return (
    <div className={`space-y-4 ${className}`}>
      {type !== "Income" && (
        <>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={disableSubmit}
            className={`w-full rounded-lg border border-slate-300 p-3 outline-none transition ${accentClasses.focus}`}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {isBudgetMode && disableSubmit && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
              {noBudgetMessage ||
                "Create at least one budget in this currency before adding expenses."}
            </p>
          )}

          {isBudgetMode && !disableSubmit && category && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Remaining budget for {category}: {currencySymbol || "₦"}
              {Number(selectedCategoryRemaining || 0).toLocaleString()}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              What did you spend it on?
            </label>

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rice, trip to work, electricity bill"
              className={`w-full rounded-lg border border-slate-300 p-3 outline-none transition ${accentClasses.focus}`}
            />
          </div>
        </>
      )}

      {type === "Income" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {categoryLabel}
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full rounded-lg border border-slate-300 p-3 outline-none transition ${accentClasses.focus}`}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {dateLabel}
        </label>

        <input
          type={isDateSelected ? "date" : "text"}
          value={date}
          max={new Date().toISOString().split("T")[0]}
          placeholder="Select date"
          onFocus={(e) => {
            if (!date) {
              e.target.type = "date";
            }
          }}
          onBlur={(e) => {
            if (!date) {
              e.target.type = "text";
            }
          }}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full min-w-0 max-w-full box-border appearance-none rounded-lg border border-slate-300 p-3 outline-none transition ${accentClasses.focus}`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {amountLabel}
        </label>

        <input
          type="number"
          placeholder={amountPlaceholder}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-full min-w-0 max-w-full box-border appearance-none rounded-lg border border-slate-300 p-3 outline-none transition ${accentClasses.focus}`}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disableSubmit}
        className={`mt-2 w-full rounded-lg py-3 font-semibold text-white transition ${accentClasses.button}`}
      >
        {buttonText}
      </button>
    </div>
  );
}

function ExpenseForm(props) {
  return <TransactionForm {...props} type="Expense" />;
}

export { TransactionForm };
export default ExpenseForm;
