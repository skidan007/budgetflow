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
  // LogOut,
  X,
} from "lucide-react";
// import toast from "react-hot-toast";
// import { supabase } from "../lib/supabaseClient";

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
     { name: "AI Planner", path: "/ai-planner", icon: Sparkles },
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

  // const handleLogout = async () => {
  //   const { error } = await supabase.auth.signOut();

  //   if (error) {
  //     console.error("Logout error:", error);
  //     toast.error(error.message);
  //     return;
  //   }

  //   toast.success("Logged out successfully.");
  //   onClose?.();
  // };

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
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center border-b border-slate-800 px-5">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="BudgetFlow"
              className="h-12 w-auto rounded-full object-contain"
            />

            <span className="text-xl font-bold text-white">BudgetFlow</span>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
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

                <span className="ml-3">{menu.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout
        <div className="shrink-0 border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg p-3 text-slate-300 transition hover:bg-red-600 hover:text-white"
          >
            <LogOut size={20} />

            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div> */}
      </aside>
    </>
  );
};

export default Sidebar;
