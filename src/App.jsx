import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import CompoundInterest from "./pages/compoundInterest";
import Settings from "./pages/Settings";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="compound-interest" element={<CompoundInterest />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="goals" element={<Goals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
