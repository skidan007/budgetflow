import { useState } from "react";
import { toast } from "react-toastify";
import InvestmentScenarioCard from "../components/InvestmentScenarioCard";
import { useFinance } from "../context/FinanceContext";
import YearlyBreakdownTable from "../components/YearlyBreakdownTable";
import CompoundInterestChart from "../components/CompoundInterestChart";
import { calculateCompoundInterest } from "../utils/compoundInterest";
import CompoundInterestSummary from "../components/CompoundInterestSummary";
import CompoundInterestForm from "../components/CompoundInterestForm";

function CompoundInterest() {
  const [currency, setCurrency] = useState("₦");
  const [principal, setPrincipal] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(25000);
  const [interestRate, setInterestRate] = useState(12);
  const [years, setYears] = useState(10);
  const [frequency, setFrequency] = useState("Monthly");

  const { investmentScenarios, setInvestmentScenarios } = useFinance();

  const [scenarioTitle, setScenarioTitle] = useState("");

  const { futureValue, totalContributions, interestEarned, yearlyData } =
    calculateCompoundInterest({
      principal,
      monthlyContribution,
      interestRate,
      years,
      frequency,
    });

  const handleSaveScenario = () => {
    if (!scenarioTitle.trim()) {
      toast.error("Please enter a scenario name.");
      return;
    }

    setInvestmentScenarios((prev) => [
      {
        id: Date.now(),
        title: scenarioTitle,

        currency,

        principal,

        monthlyContribution,

        interestRate,

        years,

        frequency,

        futureValue,

        totalContributions,

        interestEarned,

        createdAt: new Date().toISOString(),
      },

      ...prev,
    ]);

    toast.success("Scenario saved successfully!");

    setScenarioTitle("");
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Compound Interest Calculator</h1>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <label className="mb-2 block text-sm font-medium">Scenario Name</label>

        <input
          type="text"
          value={scenarioTitle}
          onChange={(e) => setScenarioTitle(e.target.value)}
          placeholder="House Fund"
          className="w-full rounded-lg border p-3"
        />
      </div>
      <CompoundInterestForm
        principal={principal}
        setPrincipal={setPrincipal}
        monthlyContribution={monthlyContribution}
        setMonthlyContribution={setMonthlyContribution}
        interestRate={interestRate}
        setInterestRate={setInterestRate}
        years={years}
        setYears={setYears}
        frequency={frequency}
        setFrequency={setFrequency}
        currency={currency}
        setCurrency={setCurrency}
      />

      <button
        onClick={handleSaveScenario}
        className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Save Scenario
      </button>

      <CompoundInterestSummary
        currency={currency}
        futureValue={futureValue}
        totalContributions={totalContributions}
        interestEarned={interestEarned}
      />

      <CompoundInterestChart data={yearlyData} currency={currency} />
      <YearlyBreakdownTable data={yearlyData} currency={currency} />

      {investmentScenarios.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">Saved Scenarios</h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {investmentScenarios.map((scenario) => (
              <InvestmentScenarioCard
                key={scenario.id}
                scenario={scenario}
                onOpen={(scenario) => {
                  setPrincipal(scenario.principal);
                  setMonthlyContribution(scenario.monthlyContribution);
                  setInterestRate(scenario.interestRate);
                  setYears(scenario.years);
                  setFrequency(scenario.frequency);
                  setCurrency(scenario.currency);
                  setScenarioTitle(scenario.title);
                }}
                onDelete={(id) => {
                  setInvestmentScenarios((prev) =>
                    prev.filter((scenario) => scenario.id !== id)
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default CompoundInterest;
