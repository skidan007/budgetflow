export function calculateMonthsBetweenDates(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return 0;
  }

  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}