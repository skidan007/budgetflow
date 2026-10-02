const MAX_SAFE_MINOR = BigInt(Number.MAX_SAFE_INTEGER);

export function toMinorUnits(value, decimalSeparator = ".") {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parts = text.split(decimalSeparator);
  if (parts.length > 2) return null;
  const whole = parts[0] || "0";
  const fraction = parts[1] || "";
  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return null;
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0") || "0");
  return minor <= MAX_SAFE_MINOR ? Number(minor) : null;
}

export function fromMinorUnits(value) {
  if (!Number.isSafeInteger(value)) return null;
  return value / 100;
}

export function allocatePlannerAmounts(totalMinor, categories, decimalSeparator = ".") {
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) {
    return { error: "invalid_total" };
  }
  if (!categories.length) return { error: "no_categories" };

  const rows = categories.map((category) => ({ ...category, amountMinor: null }));
  let fixedMinor = 0;
  for (const row of rows) {
    if (row.mode !== "specific") continue;
    const amountMinor = toMinorUnits(row.amount, decimalSeparator);
    if (amountMinor === null) return { error: "invalid_amount", category: row.name };
    fixedMinor += amountMinor;
    row.amountMinor = amountMinor;
    if (!Number.isSafeInteger(fixedMinor)) return { error: "invalid_amount", category: row.name };
  }

  const overMinor = fixedMinor - totalMinor;
  if (overMinor > 0) return { error: "overallocated", overMinor };

  const automatic = rows.filter((row) => row.mode === "automatic");
  const remainingMinor = totalMinor - fixedMinor;
  if (automatic.length) {
    const weightTotal = automatic.reduce((sum, row) => sum + Number(row.weight || 0), 0);
    if (!Number.isSafeInteger(weightTotal) || weightTotal <= 0) return { error: "invalid_weights" };
    let distributedMinor = 0;
    let distributedCount = 0;
    for (const row of rows) {
      if (row.mode !== "automatic") continue;
      distributedCount += 1;
      if (distributedCount === automatic.length) {
        row.amountMinor = remainingMinor - distributedMinor;
      } else {
        const numerator = BigInt(remainingMinor) * BigInt(row.weight) * 2n + BigInt(weightTotal);
        const denominator = BigInt(weightTotal) * 2n;
        row.amountMinor = Number(numerator / denominator);
      }
      distributedMinor += row.amountMinor;
    }
  }

  const plannedMinor = rows.reduce((sum, row) => sum + Number(row.amountMinor || 0), 0);
  return { rows, totalMinor, plannedMinor, remainingMinor: totalMinor - plannedMinor };
}

export function totalMinorUnits(rows) {
  if (rows.some((row) => !Number.isSafeInteger(row.amountMinor) || row.amountMinor < 0)) return null;
  const total = rows.reduce((sum, row) => sum + row.amountMinor, 0);
  return Number.isSafeInteger(total) ? total : null;
}
