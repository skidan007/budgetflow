import { Menu } from "lucide-react";

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Burger menu - mobile only */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <Menu size={24} />
        </button>

        <h2 className="font-semibold text-slate-900">
          Dashboard
        </h2>
      </div>

      {/* Right side */}
      <div className="font-medium text-slate-700">
        Daniel
      </div>
    </header>
  );
};

export default Navbar;