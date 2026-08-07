// import { useFinance } from "../context/FinanceContext";

// function DashboardGoals() {
//   const { goals } = useFinance();

//   const formatMoney = (value, currency = "₦") => {
//     return `${currency}${Number(value || 0).toLocaleString(
//       undefined,
//       {
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 2,
//       },
//     )}`;
//   };

//   if (!goals || goals.length === 0) {
//     return (
//       <div className="rounded-xl bg-white p-6 shadow-md">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-xl font-semibold text-slate-900">
//               Your Goals
//             </h2>

//             <p className="mt-1 text-sm text-slate-500">
//               Start saving toward something important.
//             </p>
//           </div>

//           <span className="text-3xl">🎯</span>
//         </div>

//         <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
//           <p className="text-sm text-slate-500">
//             You haven't created any savings goals yet.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Only show active goals on the dashboard
//   const activeGoals = goals.filter(
//     (goal) =>
//       Number(goal.currentAmount || 0) <
//       Number(goal.targetAmount || 0),
//   );

//   // Total amount currently saved across goals
//   const totalSaved = goals.reduce(
//     (total, goal) =>
//       total + Number(goal.currentAmount || 0),
//     0,
//   );

//   // Total target amount
//   const totalTarget = goals.reduce(
//     (total, goal) =>
//       total + Number(goal.targetAmount || 0),
//     0,
//   );

//   // Average progress
//   const averageProgress =
//     totalTarget > 0
//       ? Math.min(
//           (totalSaved / totalTarget) * 100,
//           100,
//         )
//       : 0;

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}

//       <div className="rounded-xl bg-white p-6 shadow-md">
//         <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h2 className="text-xl font-semibold text-slate-900">
//               Your Goals
//             </h2>

//             <p className="mt-1 text-sm text-slate-500">
//               Track your savings progress.
//             </p>
//           </div>

//           <div className="rounded-lg bg-indigo-50 px-4 py-3">
//             <p className="text-xs font-medium text-indigo-600">
//               Active Goals
//             </p>

//             <p className="text-xl font-bold text-indigo-700">
//               {activeGoals.length}
//             </p>
//           </div>
//         </div>

//         {/* SUMMARY */}

//         <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div className="rounded-lg bg-slate-50 p-4">
//             <p className="text-xs text-slate-500">
//               Total Saved
//             </p>

//             <p className="mt-1 text-lg font-bold text-slate-900">
//               {formatMoney(
//                 totalSaved,
//                 goals[0]?.currency || "₦",
//               )}
//             </p>
//           </div>

//           <div className="rounded-lg bg-slate-50 p-4">
//             <p className="text-xs text-slate-500">
//               Total Target
//             </p>

//             <p className="mt-1 text-lg font-bold text-slate-900">
//               {formatMoney(
//                 totalTarget,
//                 goals[0]?.currency || "₦",
//               )}
//             </p>
//           </div>

//           <div className="rounded-lg bg-slate-50 p-4">
//             <p className="text-xs text-slate-500">
//               Overall Progress
//             </p>

//             <p className="mt-1 text-lg font-bold text-indigo-600">
//               {averageProgress.toFixed(1)}%
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* GOAL LIST */}

//       <div className="rounded-xl bg-white p-6 shadow-md">
//         <div className="space-y-5">
//           {goals.slice(0, 3).map((goal) => {
//             const currentAmount =
//               Number(goal.currentAmount) || 0;

//             const targetAmount =
//               Number(goal.targetAmount) || 0;

//             const progress =
//               targetAmount > 0
//                 ? Math.min(
//                     (currentAmount /
//                       targetAmount) *
//                       100,
//                     100,
//                   )
//                 : 0;

//             const completed =
//               currentAmount >= targetAmount;

//             return (
//               <div
//                 key={goal.id}
//                 className="rounded-lg border border-slate-200 p-4"
//               >
//                 {/* GOAL HEADER */}

//                 <div className="flex items-start justify-between gap-4">
//                   <div className="flex items-center gap-3">
//                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-xl">
//                       {goal.type?.split(" ")[0] ||
//                         "🎯"}
//                     </div>

//                     <div>
//                       <h3 className="font-semibold text-slate-900">
//                         {goal.name}
//                       </h3>

//                       <p className="text-xs text-slate-500">
//                         Target:{" "}
//                         {formatMoney(
//                           targetAmount,
//                           goal.currency ||
//                             "₦",
//                         )}
//                       </p>
//                     </div>
//                   </div>

//                   <span
//                     className={`rounded-full px-3 py-1 text-xs font-semibold ${
//                       completed
//                         ? "bg-green-100 text-green-700"
//                         : "bg-indigo-100 text-indigo-700"
//                     }`}
//                   >
//                     {completed
//                       ? "Completed"
//                       : `${progress.toFixed(0)}%`}
//                   </span>
//                 </div>

//                 {/* PROGRESS */}

//                 <div className="mt-4">
//                   <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
//                     <div
//                       className={`h-full rounded-full transition-all ${
//                         completed
//                           ? "bg-green-500"
//                           : "bg-indigo-600"
//                       }`}
//                       style={{
//                         width: `${progress}%`,
//                       }}
//                     />
//                   </div>
//                 </div>

//                 {/* AMOUNTS */}

//                 <div className="mt-3 flex items-center justify-between text-sm">
//                   <span className="font-medium text-slate-700">
//                     {formatMoney(
//                       currentAmount,
//                       goal.currency ||
//                         "₦",
//                     )}{" "}
//                     saved
//                   </span>

//                   <span className="text-slate-500">
//                     {formatMoney(
//                       Math.max(
//                         targetAmount -
//                           currentAmount,
//                         0,
//                       ),
//                       goal.currency ||
//                         "₦",
//                     )}{" "}
//                     remaining
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* MORE GOALS */}

//         {goals.length > 3 && (
//           <p className="mt-5 text-center text-sm text-slate-500">
//             Showing your first 3 goals. Visit the
//             Goals page to see all your goals.
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default DashboardGoals;

import { Link } from "react-router-dom";
import { useFinance } from "../context/FinanceContext";

function DashboardGoals() {
  const { goals } = useFinance();

  const formatMoney = (value, currency = "₦") => {
    return `${currency}${Number(value || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )}`;
  };

  // No goals
  if (!goals || goals.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Your Goals
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track your savings goals and progress.
            </p>
          </div>

          <span className="text-3xl">🎯</span>
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            No savings goals yet.
          </p>

          <Link
            to="/goals"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create a Goal
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total saved
  const totalSaved = goals.reduce(
    (total, goal) =>
      total + Number(goal.currentAmount || 0),
    0,
  );

  // Calculate total target
  const totalTarget = goals.reduce(
    (total, goal) =>
      total + Number(goal.targetAmount || 0),
    0,
  );

  // Calculate overall progress
  const overallProgress =
    totalTarget > 0
      ? Math.min(
          (totalSaved / totalTarget) * 100,
          100,
        )
      : 0;

  const currency = goals[0]?.currency || "₦";

  return (
    <section className="rounded-xl bg-white p-6 shadow-md">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Your Goals
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your savings progress.
          </p>
        </div>

        <Link
          to="/goals"
          className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
        >
          View Goals →
        </Link>
      </div>

      {/* SUMMARY */}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            Active Goals
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {goals.length}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            Total Saved
          </p>

          <p className="mt-1 text-lg font-bold text-green-600">
            {formatMoney(totalSaved, currency)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            Overall Progress
          </p>

          <p className="mt-1 text-lg font-bold text-indigo-600">
            {overallProgress.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* GOALS */}

      <div className="mt-6 space-y-4">
        {goals.slice(0, 3).map((goal) => {
          const currentAmount =
            Number(goal.currentAmount) || 0;

          const targetAmount =
            Number(goal.targetAmount) || 0;

          const progress =
            targetAmount > 0
              ? Math.min(
                  (currentAmount /
                    targetAmount) *
                    100,
                  100,
                )
              : 0;

          const isCompleted =
            currentAmount >= targetAmount;

          return (
            <div
              key={goal.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              {/* NAME + PROGRESS */}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {goal.type
                      ? goal.type.split(" ")[0]
                      : "🎯"}
                  </span>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {goal.name}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Target:{" "}
                      {formatMoney(
                        targetAmount,
                        goal.currency ||
                          currency,
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-semibold ${
                    isCompleted
                      ? "text-green-600"
                      : "text-indigo-600"
                  }`}
                >
                  {isCompleted
                    ? "Completed"
                    : `${progress.toFixed(0)}%`}
                </span>
              </div>

              {/* PROGRESS BAR */}

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-indigo-600"
                  }`}
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              {/* AMOUNT */}

              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate-600">
                  {formatMoney(
                    currentAmount,
                    goal.currency ||
                      currency,
                  )}{" "}
                  saved
                </span>

                <span className="text-slate-400">
                  {formatMoney(
                    Math.max(
                      targetAmount -
                        currentAmount,
                      0,
                    ),
                    goal.currency ||
                      currency,
                  )}{" "}
                  remaining
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MORE GOALS */}

      {goals.length > 3 && (
        <div className="mt-5 text-center">
          <Link
            to="/goals"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all {goals.length} goals →
          </Link>
        </div>
      )}
    </section>
  );
}

export default DashboardGoals;