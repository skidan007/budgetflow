import { Suspense, lazy, useState } from "react";
import { toast } from "react-hot-toast";
import { calculateCompoundInterest } from "../utils/compoundInterest";
import CompoundInterestSummary from "../components/CompoundInterestSummary";
import CompoundInterestForm from "../components/CompoundInterestForm";

const YearlyBreakdownTable = lazy(() => import("../components/YearlyBreakdownTable"));
const CompoundInterestChart = lazy(() => import("../components/CompoundInterestChart"));
const RateComparisonChart = lazy(() => import("../components/RateComparisonChart"));
const RateComparisonControls = lazy(
  () => import("../components/RateComparisonControls"),
);
const FinancialInsights = lazy(() => import("../components/FinancialInsights"));

function CompoundInterest() {
  const [currency, setCurrency] = useState("₦");
  const [principal, setPrincipal] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [years, setYears] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [growthView, setGrowthView] = useState("Yearly");

  const [interestRate, setInterestRate] = useState("");

  const [inflationRate, setInflationRate] = useState("");
  const [comparisonRates, setComparisonRates] = useState([10, 12, 15]);
  const [contributionFrequency, setContributionFrequency] = useState("Monthly");

  const isFormValid =
    principal !== "" &&
    monthlyContribution !== "" &&
    interestRate !== "" &&
    inflationRate !== "" &&
    years !== "" &&
    Number(principal) >= 0 &&
    Number(monthlyContribution) >= 0 &&
    Number(interestRate) >= 0 &&
    Number(inflationRate) >= 0 &&
    Number(years) > 0;

  const ratesToCompare = [
    ...new Set([...comparisonRates, Number(interestRate)]),
  ].sort((a, b) => a - b);

  const calculationResults = isFormValid
    ? calculateCompoundInterest({
        principal,
        monthlyContribution,
        interestRate,
        inflationRate,
        years,
        frequency,
        contributionFrequency,
        comparisonRates: ratesToCompare,
      })
    : {
        futureValue: 0,
        totalContributions: 0,
        interestEarned: 0,
        inflationAdjustedValue: 0,
        yearlyData: [],
        monthlyData: [],
        rateComparisonData: [],
        rateComparisonGrowthData: [],
      };

  const {
    futureValue,
    totalContributions,
    interestEarned,
    inflationAdjustedValue,
    yearlyData,
    monthlyData,
    rateComparisonData,
    rateComparisonGrowthData,
  } = calculationResults;

  const handleExportPDF = async () => {
    try {
      const { exportCompoundInterestPDF } = await import(
        "../utils/exportCompoundInterestPDF"
      );

      await exportCompoundInterestPDF({
        currency,
        principal,
        monthlyContribution,
        interestRate,
        inflationRate,
        years,
        frequency,
        futureValue,
        totalContributions,
        interestEarned,
        inflationAdjustedValue,
        rateComparisonData,
        yearlyData,
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Unable to export PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyResults = async () => {
    const results = `
BudgetFlow — Compound Interest Calculation

Initial Investment: ${currency}${Number(principal).toLocaleString()}
Monthly Contribution: ${currency}${Number(monthlyContribution).toLocaleString()}
Interest Rate: ${interestRate}%
Inflation Rate: ${inflationRate}%
Investment Duration: ${years} years
Compounding Frequency: ${frequency}

Future Value: ${currency}${Number(futureValue).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}

Total Contributions: ${currency}${Number(totalContributions).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}

Interest Earned: ${currency}${Number(interestEarned).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}

Inflation Adjusted Value: ${currency}${Number(
      inflationAdjustedValue,
    ).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
`;

    try {
      await navigator.clipboard.writeText(results);

      toast.success("Calculation copied successfully!");
    } catch {
      toast.error("Unable to copy calculation.");
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Compound Interest Calculator</h1>

      <CompoundInterestForm
        principal={principal}
        setPrincipal={setPrincipal}
        monthlyContribution={monthlyContribution}
        setMonthlyContribution={setMonthlyContribution}
        interestRate={interestRate}
        setInterestRate={setInterestRate}
        inflationRate={inflationRate}
        setInflationRate={setInflationRate}
        years={years}
        setYears={setYears}
        frequency={frequency}
        setFrequency={setFrequency}
        contributionFrequency={contributionFrequency}
        setContributionFrequency={setContributionFrequency}
        currency={currency}
        setCurrency={setCurrency}
      />

      <CompoundInterestSummary
        currency={currency}
        futureValue={futureValue}
        totalContributions={totalContributions}
        interestEarned={interestEarned}
        inflationAdjustedValue={inflationAdjustedValue}
      />

      <div className="flex lg:flex-row flex-col gap-3 ">
        <button
          type="button"
          onClick={handleCopyResults}
          className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Copy Results
        </button>

        <button
          type="button"
          onClick={handleExportPDF}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          📄 Export PDF
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Print Calculation
        </button>
      </div>
      <h1 className="mb-6 hidden text-2xl font-bold print:block">
        BudgetFlow — Compound Interest Calculation
      </h1>

      {isFormValid &&
        (growthView === "Yearly" ? (
          <Suspense
            fallback={
              <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
                Loading chart...
              </div>
            }
          >
            <CompoundInterestChart
              data={yearlyData}
              currency={currency}
              growthView={growthView}
              setGrowthView={setGrowthView}
              xKey="year"
            />

            <YearlyBreakdownTable data={yearlyData} currency={currency} />
          </Suspense>
        ) : (
          <Suspense
            fallback={
              <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
                Loading chart...
              </div>
            }
          >
            <CompoundInterestChart
              data={monthlyData}
              currency={currency}
              growthView={growthView}
              setGrowthView={setGrowthView}
              xKey="month"
            />

            <YearlyBreakdownTable data={monthlyData} currency={currency} />
          </Suspense>
        ))}

      {/* Interest Rate Comparison */}

      {isFormValid && (
        <Suspense
          fallback={
            <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
              Loading comparison tools...
            </div>
          }
        >
          <RateComparisonControls
            comparisonRates={comparisonRates}
            setComparisonRates={setComparisonRates}
            currentRate={Number(interestRate)}
          />

          <RateComparisonChart
            data={rateComparisonGrowthData}
            currency={currency}
            comparisonRates={ratesToCompare}
            currentRate={Number(interestRate)}
          />
        </Suspense>
      )}
      {!isFormValid && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Please correct the highlighted fields before viewing your investment
          calculation.
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-2 text-xl font-semibold">Interest Rate Comparison</h2>

        <p className="mb-6 text-sm text-slate-500">
          See how different interest rates could affect your final investment
          value.
        </p>

        <div className="space-y-3">
          {rateComparisonData.map((item) => (
            <div
              key={item.rate}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
            >
              <span className="font-medium">{item.rate}%</span>

              <span className="font-bold text-slate-900">
                {currency}
                {item.futureValue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
            Loading insights...
          </div>
        }
      >
        <FinancialInsights
          currency={currency}
          years={years}
          futureValue={futureValue}
          totalContributions={totalContributions}
          interestEarned={interestEarned}
          inflationAdjustedValue={inflationAdjustedValue}
          rateComparisonData={rateComparisonData}
        />
      </Suspense>
    </section>
  );
}

export default CompoundInterest;
