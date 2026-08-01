const TransactionItem = ({ transaction, onDelete, onEdit }) => {
  console.log(transaction);
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
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(transaction)}
          className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(transaction.id)}
          className="rounded-lg bg-red-600 px-4 py-2 text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TransactionItem;
