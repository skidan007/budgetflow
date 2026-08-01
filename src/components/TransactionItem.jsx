const TransactionItem = ({ transaction, onDelete, onEdit }) => {
  const isIncome = transaction.type === "Income";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        {/* Left Side */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            {transaction.category}
          </h3>

          <p
            className={`mt-1 text-sm ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type} • {transaction.date}
          </p>
        </div>

        {/* Right Side */}
        <p
          className={`text-xl font-bold ${
            isIncome ? "text-green-600" : "text-red-600"
          }`}
        >
          ₦{transaction.amount.toLocaleString()}
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => onEdit(transaction)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          ✏️ Edit
        </button>

        <button
          onClick={() => onDelete(transaction.id)}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
};

export default TransactionItem;