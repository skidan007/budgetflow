import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main Content */}
      <div className="min-h-screen md:ml-64">
        <Navbar onMenuClick={handleOpenSidebar} />

        <main className=" p-4 pt-30 md:p-6 md:pt-30">
          <Outlet  />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;