import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Navbar />

        <main className="p-6 ">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
