import { useState } from "react";
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


  const [inflationRate, setInflationRate] = useState(8);

  const {
    futureValue,
    totalContributions,
    interestEarned,
    inflationAdjustedValue,
    yearlyData,
  } = calculateCompoundInterest({
    principal,
    monthlyContribution,
    interestRate,
    inflationRate,
    years,
    frequency,
  });

  // const handleSaveScenario = () => {
  //   if (!scenarioTitle.trim()) {
  //     toast.error("Please enter a scenario name.");
  //     return;
  //   }

  //   setInvestmentScenarios((prev) => [
  //     {
  //       id: Date.now(),
  //       title: scenarioTitle,

  //       currency,

  //       principal,

  //       monthlyContribution,

  //       interestRate,

  //       years,

  //       frequency,

  //       futureValue,

  //       totalContributions,

  //       interestEarned,

  //       createdAt: new Date().toISOString(),
  //     },

  //     ...prev,
  //   ]);

  //   toast.success("Scenario saved successfully!");

  //   setScenarioTitle("");
  // };

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

      <CompoundInterestChart data={yearlyData} currency={currency} />
      <YearlyBreakdownTable data={yearlyData} currency={currency} />

      
    </section>
  );
}

export default CompoundInterest;
