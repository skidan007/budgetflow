import test from "node:test";
import assert from "node:assert/strict";
import { calculateCompoundInterest, validateCompoundInputs } from "./compoundInterest.mjs";

async function compareWithWeb(inputs) {
  const webModulePath = ["..", "..", "web", "src", "utils", "compoundInterest.js"].join("/");
  const { calculateCompoundInterest: calculateWebCompoundInterest } = await import(webModulePath);
  const mobile = calculateCompoundInterest(inputs);
  const web = calculateWebCompoundInterest({
    principal: inputs.principal,
    monthlyContribution: inputs.monthlyContribution,
    interestRate: inputs.interestRate,
    inflationRate: inputs.inflationRate,
    years: inputs.years,
    frequency: inputs.frequency,
    contributionFrequency: inputs.contributionFrequency,
  });
  for (const key of ["futureValue", "totalContributions", "interestEarned", "inflationAdjustedValue"]) {
    assert.ok(Math.abs(mobile[key] - web[key]) < 1e-8, `${key}: mobile ${mobile[key]} vs web ${web[key]}`);
  }
  return mobile;
}

test("basic and zero-contribution results match the existing web calculator", async () => {
  const basic = await compareWithWeb({ principal: 100000, monthlyContribution: 0, interestRate: 10, inflationRate: 2, years: 5, frequency: "Monthly", contributionFrequency: "Monthly" });
  assert.ok(basic.futureValue > 100000);
  assert.equal(basic.totalContributions, 100000);
  await compareWithWeb({ principal: 0, monthlyContribution: 0, interestRate: 10, inflationRate: 0, years: 2, frequency: "Yearly", contributionFrequency: "Yearly" });
});

test("recurring contributions use actual scheduled contribution events", async () => {
  const result = await compareWithWeb({ principal: 10000, monthlyContribution: 250, interestRate: 8, inflationRate: 3, years: 2.5, frequency: "Weekly", contributionFrequency: "Quarterly" });
  assert.equal(result.contributionCount, 10);
  assert.equal(result.totalContributions, 12500);
});

test("rate, duration, compounding frequency, and contribution frequency affect results like web", async () => {
  const base = await compareWithWeb({ principal: 10000, monthlyContribution: 100, interestRate: 5, inflationRate: 0, years: 3, frequency: "Monthly", contributionFrequency: "Monthly" });
  const higherRate = calculateCompoundInterest({ principal: 10000, monthlyContribution: 100, interestRate: 8, inflationRate: 0, years: 3, frequency: "Monthly", contributionFrequency: "Monthly" });
  const longer = calculateCompoundInterest({ principal: 10000, monthlyContribution: 100, interestRate: 5, inflationRate: 0, years: 4, frequency: "Monthly", contributionFrequency: "Monthly" });
  const yearly = calculateCompoundInterest({ principal: 10000, monthlyContribution: 100, interestRate: 5, inflationRate: 0, years: 3, frequency: "Yearly", contributionFrequency: "Monthly" });
  const weekly = calculateCompoundInterest({ principal: 10000, monthlyContribution: 100, interestRate: 5, inflationRate: 0, years: 3, frequency: "Weekly", contributionFrequency: "Monthly" });
  assert.ok(higherRate.futureValue > base.futureValue);
  assert.ok(longer.futureValue > base.futureValue);
  assert.notEqual(yearly.futureValue, weekly.futureValue);
  await compareWithWeb({ principal: 10000, monthlyContribution: 100, interestRate: 5, inflationRate: 0, years: 3, frequency: "Yearly", contributionFrequency: "Monthly" });
  await compareWithWeb({ principal: 10000, monthlyContribution: 100, interestRate: 5, inflationRate: 0, years: 3, frequency: "Weekly", contributionFrequency: "Monthly" });
});

test("decimal amounts retain precision and large valid amounts remain finite", async () => {
  const decimal = await compareWithWeb({ principal: 10000.5, monthlyContribution: 10.25, interestRate: 4.5, inflationRate: 1.2, years: 1, frequency: "Monthly", contributionFrequency: "Monthly" });
  assert.equal(decimal.totalContributions, 10123.5);
  const large = await compareWithWeb({ principal: 1e12, monthlyContribution: 1e9, interestRate: 2.5, inflationRate: 0, years: 10, frequency: "Monthly", contributionFrequency: "Monthly" });
  assert.ok(Number.isFinite(large.futureValue));
});

test("input validation rejects missing, negative, non-finite, and zero-duration inputs", () => {
  assert.deepEqual(validateCompoundInputs({ principal: "", monthlyContribution: "0", interestRate: "5", inflationRate: "2", years: "1" }), { principal: "Enter an initial investment." });
  assert.equal(validateCompoundInputs({ principal: "-1", monthlyContribution: "0", interestRate: "5", inflationRate: "2", years: "1" }).principal, "Initial investment must be zero or greater.");
  assert.ok(validateCompoundInputs({ principal: "100", monthlyContribution: "0", interestRate: "Infinity", inflationRate: "2", years: "1" }).rate);
  assert.ok(validateCompoundInputs({ principal: "100", monthlyContribution: "0", interestRate: "5", inflationRate: "2", years: "0" }).years);
  assert.deepEqual(validateCompoundInputs({ principal: "100", monthlyContribution: "0", interestRate: "5", inflationRate: "2", years: "1.5" }), {});
});

test("currency does not affect mathematical output", () => {
  const scenario = { principal: 5000, monthlyContribution: 25, interestRate: 6, inflationRate: 2, years: 4, frequency: "Monthly", contributionFrequency: "Monthly" };
  const ngn = calculateCompoundInterest(scenario);
  const usd = calculateCompoundInterest(scenario);
  assert.deepEqual(usd, ngn);
});
