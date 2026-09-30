import { useState } from "react";

function RateComparisonControls({
  comparisonRates,
  setComparisonRates,
  currentRate,
}) {

    console.log("CONTROLS RECEIVED:", comparisonRates);
  const [customRate, setCustomRate] = useState("");

  const availableRates = [5, 8, 10, 12, 15, 18, 20, 25];

  const toggleRate = (rate) => {
    setComparisonRates((prev) => {
      if (prev.includes(rate)) {
        // Don't allow the user to remove the last rate
        if (prev.length === 1) {
          return prev;
        }

        return prev.filter((item) => item !== rate);
      }

      return [...prev, rate].sort((a, b) => a - b);
    });
  };

  const handleAddCustomRate = () => {
    const rate = Number(customRate);

    if (!customRate || Number.isNaN(rate)) {
      return;
    }

    if (rate <= 0 || rate > 100) {
      return;
    }

    if (!comparisonRates.includes(rate)) {
      setComparisonRates((prev) =>
        [...prev, rate].sort((a, b) => a - b),
      );
    }

    setCustomRate("");
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold">
        Compare Interest Rates
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Select rates to see how they affect your investment growth.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {availableRates.map((rate) => {
          const selected = comparisonRates.includes(rate);
          const isCurrentRate = rate === currentRate;

          return (
            <button
              key={rate}
              type="button"
              onClick={() => toggleRate(rate)}
              className={`rounded-lg border px-4 py-2 font-medium transition ${
                selected
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {rate}%

              {isCurrentRate && (
                <span className="ml-1 text-xs">
                  (Current)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="number"
          min="0.01"
          max="100"
          step="0.1"
          value={customRate}
          onChange={(e) => setCustomRate(e.target.value)}
          placeholder="e.g. 17.5"
          className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
        />

        <button
          type="button"
          onClick={handleAddCustomRate}
          className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Add Rate
        </button>
      </div>
    </div>
  );
}

export default RateComparisonControls;