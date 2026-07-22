
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wallet, Receipt, Target, ChartBar, Calculator, Settings } from "lucide-react";

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
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-10">💰 BudgetFlow</h1>

      <nav className="space-y-3">
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
