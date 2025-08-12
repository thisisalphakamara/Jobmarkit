import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Import your Publishable Key
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder";

// For development, if no key is provided, show a warning but don't crash
if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set. Please create a .env file with your Clerk publishable key."
  );
}

const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <SocketProvider backendUrl={backendUrl}>
          <AppContextProvider>
            <App />
          </AppContextProvider>
        </SocketProvider>
      </BrowserRouter>
    </ClerkProvider>
  </ErrorBoundary>
);
