function ExpenseForm({
  expenseInput,
  setExpenseInput,
  expenseCategory,
  setExpenseCategory,
  expenseDate,
  setExpenseDate,
  onSubmit,
  buttonText,
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">{buttonText}</h2>

      <div className="space-y-4">
        <select
          value={expenseCategory}
          onChange={(e) => setExpenseCategory(e.target.value)}
          className="w-full rounded-lg border p-3"
        >
          <option>Food</option>
          <option>Transport</option>
          <option>Bills</option>
          <option>Entertainment</option>
          <option>Shopping</option>
          <option>Health</option>
        </select>

        <input
          type="date"
          value={expenseDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="w-full rounded-lg border p-3"
        />

        <input
          type="number"
          placeholder="Amount"
          value={expenseInput}
          onChange={(e) => setExpenseInput(e.target.value)}
          className="w-full rounded-lg border p-3"
        />

        <button
          onClick={onSubmit}
          className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default ExpenseForm;
