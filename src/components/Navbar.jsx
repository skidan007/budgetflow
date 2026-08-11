import { Menu } from "lucide-react";


const Navbar = ({ onMenuClick }) => {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-20 border-b border-slate-200 bg-white shadow-sm md:left-64">
      <div className="flex h-full items-center justify-between px-4 md:px-6">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* MOBILE BURGER */}
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <Menu size={24} />
          </button>

          {/* MOBILE LOGO */}
          <div className="flex items-center gap-2 md:hidden">
            {/* <img
              src={logo}
              alt="BudgetFlow"
              className="h-12 w-auto rounded-full object-contain"
            /> */}

            <span className="text-lg font-bold text-slate-900">
              BudgetFlow
            </span>
          </div>

          {/* DESKTOP PAGE TITLE */}
          {/* <h2 className="hidden font-semibold text-slate-900 md:block">
            Dashboard
          </h2> */}
        </div>

        {/* USERNAME */}
        <div className="font-semibold text-slate-700">
          Daniel
        </div>

      </div>
    </header>
  );
};

export default Navbar;