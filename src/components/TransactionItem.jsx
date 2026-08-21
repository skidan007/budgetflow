const currencyMap = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
};

const TransactionItem = ({
  transaction,
  onDelete,
  onEdit,
  showActions = true,
}) => {
  const isIncome = transaction.type === "Income";

  const description =
    !isIncome && typeof transaction.description === "string"
      ? transaction.description.trim()
      : "";

  const hasDescription = Boolean(description);

  const transactionCurrency =
    currencyMap[transaction.currency] || "₦";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Top Section */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side */}
        <div>
          <h3 className="font-semibold text-slate-900">
            {transaction.category}
          </h3>

          {hasDescription && (
            <p className="mt-1 text-sm text-slate-700">{description}</p>
          )}

          <p
            className={`mt-1 text-sm ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome
              ? `${transaction.type} • ${transaction.date}`
              : transaction.date}
          </p>
        </div>

        {/* Right Side */}
        <p
          className={`text-xl font-bold ${
            isIncome ? "text-green-600" : "text-red-600"
          }`}
        >
          {isIncome ? "+" : "-"}
          {transactionCurrency}
          {Number(transaction.amount || 0).toLocaleString()}
        </p>
      </div>

      {/* Buttons */}
      {showActions && (
        <div className="mt-4 flex justify-end gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              ✏️ Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(transaction.id)}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
