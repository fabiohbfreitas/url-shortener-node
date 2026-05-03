import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { useAuth } from "./stores/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function InitSession() {
  const checkSession = useAuth((s) => s.checkSession);
  const isInitialized = useAuth((s) => s.isInitialized);
  useEffect(() => {
    if (!isInitialized) checkSession();
  }, [checkSession, isInitialized]);
  return null;
}

document.body.classList.add("font-mono", "bg-bg", "text-primary");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <InitSession />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
