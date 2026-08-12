import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { registerSW } from "virtual:pwa-register";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { FinanceProvider } from "./context/FinanceContext";
import "./index.css";
import App from "./App.jsx";

const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm("A new version is available. Refresh to update?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("BudgetFlow is ready to work offline.");
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <FinanceProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </FinanceProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
