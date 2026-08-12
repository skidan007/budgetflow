// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import MainLayout from "./layouts/MainLayout";
// import Dashboard from "./pages/Dashboard";
// import Budgets from "./pages/Budgets";
// import Expenses from "./pages/Expenses";
// import Goals from "./pages/Goals";
// import Reports from "./pages/Reports";
// import CompoundInterest from "./pages/CompoundInterest";
// import Settings from "./pages/Settings";
// import "./App.css";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route element={<MainLayout />}>
//           <Route index element={<Dashboard />} />
//           <Route path="compound-interest" element={<CompoundInterest />} />
//           <Route path="budgets" element={<Budgets />} />
//           <Route path="expenses" element={<Expenses />} />
//           <Route path="goals" element={<Goals />} />
//           <Route path="reports" element={<Reports />} />
//           <Route path="settings" element={<Settings />} />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;
 
import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import "./App.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Goals = lazy(() => import("./pages/Goals"));
const Reports = lazy(() => import("./pages/Reports"));
const CompoundInterest = lazy(() => import("./pages/CompoundInterest"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">
            Loading BudgetFlow...
          </div>
        }
      >
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="goals" element={<Goals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="compound-interest" element={<CompoundInterest />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;