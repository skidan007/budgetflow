import { StrictMode } from "react";
import { FinanceProvider } from "./context/FinanceContext";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FinanceProvider>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </FinanceProvider>
  </StrictMode>,
);
