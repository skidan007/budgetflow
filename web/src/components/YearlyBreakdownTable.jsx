function YearlyBreakdownTable({ data = [], currency }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">Yearly Breakdown</h2>

      <div className="max-h-96 overflow-y-auto rounded-lg border">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              <th className="border-b p-3 text-left">Year</th>
              <th className="border-b p-3 text-right">Investment Value</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.year} className="hover:bg-slate-50">
                <td className="border-b p-3">{item.year}</td>

                <td className="border-b p-3 text-right font-semibold">
                  {currency}
                  {item.value.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default YearlyBreakdownTable;
