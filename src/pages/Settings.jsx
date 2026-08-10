import { useState } from "react";
import { useFinance } from "../context/FinanceContext";

const currencies = [
  {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
  },
  {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
  },
  {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
  },
];

const Settings = () => {
  const { defaultCurrency, setDefaultCurrency } = useFinance();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 3000);
};

  const selectedCurrency = currencies.find(
    (currency) => currency.code === defaultCurrency,
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

        <p className="mt-2 text-slate-500">
          Update your preferences and app configuration.
        </p>
      </div>

      {/* General Settings */}
      <div className="max-w-2xl rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold text-slate-900">
          General Settings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Choose the default currency used throughout BudgetFlow.
        </p>

        {/* Currency */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Default Currency
          </label>

          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {selectedCurrency && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Selected currency</p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {selectedCurrency.symbol} {selectedCurrency.name}
            </p>
          </div>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Save Settings
        </button>

        {/* Success message */}
        {saved && (
          <p className="mt-3 text-sm font-medium text-green-600">
            ✓ Currency settings saved successfully.
          </p>
        )}
      </div>
    </section>
  );
};

export default Settings;
