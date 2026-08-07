import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  ChartBar,
  Calculator,
  Settings,
} from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Budgets", path: "/budgets", icon: Wallet },
    { name: "Expenses", path: "/expenses", icon: Receipt },
    { name: "Goals", path: "/goals", icon: Target },
    { name: "Reports", path: "/reports", icon: ChartBar },
    { name: "Compound Interest", path: "/compound-interest", icon: Calculator },
    { name: "Settings", path: "/settings", icon: Settings },
  ];
  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 text-white">
      <div className="flex items-center p-6 mb-6 gap-2">
        <img
          src="/budgetflow-logo.png"
          alt="BudgetFlow"
          className="h-14 w-14 object-contain rounded-full "
        />

        <span className="text-xl font-bold text-white">BudgetFlow</span>
      </div>

      <nav className="space-y-3 flex-1 overflow-y-auto px-4 pb-6">
        {menuItems.map((menu) => {
          const Icon = menu.icon;
          return (
            <NavLink
              to={menu.path}
              key={menu.path}
              className={({ isActive }) =>
                isActive
                  ? "flex items-center rounded-lg p-3 bg-blue-600 text-white"
                  : "flex items-center rounded-lg p-3 hover:bg-slate-800"
              }
            >
              <Icon size={20} />
              <span className="ml-3">{menu.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
