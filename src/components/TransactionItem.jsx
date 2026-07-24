const TransactionItem = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === "Income";

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
      <div>
        <p
          className={`font-semibold ${
            isIncome ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction.type}
        </p>

        <p className="text-sm text-gray-500">{transaction.category}</p>

        <p className="text-sm text-gray-500">
          {new Date(transaction.id).toLocaleString()}
        </p>
      </div>

      <p
        className={`font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}
      >
        ₦{transaction.amount.toLocaleString()}
      </p>
      <button
        onClick={() => onDelete(transaction.id)}
        className="ml-4 rounded-lg hover:bg-red-100 text-red-700 px-4 py-2"
      >
        Delete
      </button>
    </div>
  );
};

export default TransactionItem;
