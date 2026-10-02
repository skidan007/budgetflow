export function analyzeMonthlyChange(currentValue, previousValue, hasPreviousData) {
  const current = Number(currentValue);
  const previous = Number(previousValue);

  if (!hasPreviousData || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return { direction: null, label: "No previous month data", spoken: "No previous month data" };
  }

  if (previous === 0) {
    if (current === 0) {
      return { direction: "same", label: "0% from last month", spoken: "No change from last month" };
    }
    return {
      direction: current > 0 ? "up" : "down",
      label: "New this month",
      spoken: "New this month, previous value was zero",
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  const rounded = Math.round(percentage);
  if (rounded === 0) {
    return { direction: "same", label: "0% from last month", spoken: "No change from last month" };
  }

  const amount = Math.abs(rounded).toString();
  const direction = rounded > 0 ? "up" : "down";
  return {
    direction,
    label: `${rounded > 0 ? "+" : "-"}${amount}% from last month`,
    spoken: `${direction === "up" ? "Increased" : "Decreased"} ${amount} percent from last month`,
  };
}

export function monthlyChangeTone(metric, direction) {
  if (direction === "same" || direction === null) return "muted";
  if (metric === "expenses") return direction === "up" ? "danger" : "positive";
  return direction === "up" ? "positive" : "danger";
}
