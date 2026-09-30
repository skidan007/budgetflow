import logo from "../assets/budgetflow-logo.png";
import { Sparkles } from "lucide-react";
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
    { name: "Smart Planner", path: "/ai-planner", icon: Sparkles },
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
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#0f172a] text-white transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="BudgetFlow"
              className="h-10 w-auto rounded-xl object-contain"
            />

            <span className="text-lg font-bold tracking-tight text-white">BudgetFlow</span>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-slate-300 transition hover:bg-white/10 md:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 pt-6">
          {menuItems.map((menu) => {
            const Icon = menu.icon;

            return (
              <NavLink
                to={menu.path}
                key={menu.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? "relative flex items-center rounded-xl bg-emerald-500/15 p-3 text-emerald-300 before:absolute before:left-0 before:h-6 before:w-1 before:rounded-r-full before:bg-emerald-400"
                    : "flex items-center rounded-xl p-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
                }
              >
                <Icon size={20} />

                <span className="ml-3 text-sm font-medium">{menu.name}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-300">Your money, in focus.</p>
          <p className="mt-1">Private by design.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
