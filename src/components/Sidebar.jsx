import logo from "../assets/budgetflow-logo.png";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  ChartBar,
  Calculator,
  Settings,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Budgets", path: "/budgets", icon: Wallet },
    { name: "Expenses", path: "/expenses", icon: Receipt },
    { name: "Goals", path: "/goals", icon: Target },
    { name: "Reports", path: "/reports", icon: ChartBar },
    {
      name: "Compound Interest",
      path: "/compound-interest",
      icon: Calculator,
    },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-900 text-white transition-transform duration-300
        ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }
        md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <img src={logo} alt="BudgetFlow" className="h-13 rounded-full w-13 mr-1" />
          <span className="text-xl font-bold text-white">
            BudgetFlow
          </span>

          {/* Close button - mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 overflow-y-auto px-4 pb-6 pt-4">
          {menuItems.map((menu) => {
            const Icon = menu.icon;

            return (
              <NavLink
                to={menu.path}
                key={menu.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center rounded-lg bg-blue-600 p-3 text-white"
                    : "flex items-center rounded-lg p-3 text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              >
                <Icon size={20} />

                <span className="ml-3">
                  {menu.name}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;