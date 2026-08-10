function GoalForm({
  goalTitle,
  setGoalTitle,
  goalIcon,
  setGoalIcon,
  goalTarget,
  setGoalTarget,
  goalDate,
  setGoalDate,
  goalCurrency,
  setGoalCurrency,
  onSubmit,
  buttonText,
  formTitle,
  isEditing,
  onCancel,
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-5 text-xl font-bold text-slate-900">
        {formTitle}
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
          placeholder="Emergency Fund"
          className="w-full rounded-lg border p-3"
        />

        <select
          value={goalIcon}
          onChange={(e) => setGoalIcon(e.target.value)}
          className="w-full rounded-lg border p-3"
        >
          <option value="🎯">🎯 Goal</option>
          <option value="🏠">🏠 House</option>
          <option value="🚗">🚗 Car</option>
          <option value="💻">💻 Laptop</option>
          <option value="✈️">✈️ Vacation</option>
          <option value="💍">💍 Wedding</option>
          <option value="🎓">🎓 Education</option>
          <option value="📱">📱 Phone</option>
          <option value="🏍️">🏍️ Motorcycle</option>
          <option value="👶">👶 Baby</option>
          <option value="❤️">❤️ Family</option>
        </select>

        <select
          value={goalCurrency}
          onChange={(e) => setGoalCurrency(e.target.value)}
          className="w-full rounded-lg border p-3"
        >
          <option value="₦">₦ Nigerian Naira</option>
          <option value="$">$ US Dollar</option>
          <option value="£">£ British Pound</option>
          <option value="€">€ Euro</option>
          <option value="¥">¥ Japanese Yen</option>
          <option value="C$">C$ Canadian Dollar</option>
          <option value="A$">A$ Australian Dollar</option>
          <option value="CHF">CHF Swiss Franc</option>
        </select>

        <input
          type="number"
          value={goalTarget}
          onChange={(e) => setGoalTarget(e.target.value)}
          placeholder="500000"
          className="w-full rounded-lg border p-3"
        />

        <input
          type="date"
          value={goalDate}
          onChange={(e) => setGoalDate(e.target.value)}
          className="w-full rounded-lg border p-3"
        />

        <div className="mt-4 flex gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg bg-slate-300 py-3 font-semibold"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalForm;