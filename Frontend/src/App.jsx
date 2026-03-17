import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@mantine/core";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { AuctionDetailPage } from "./pages/AuctionDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { useEffect } from "react";
import { handleInvalidSession } from "./helpers";
import { notifications } from "@mantine/notifications";

const DEBUG = import.meta.env.DEV; // checks if environment is dev of prod

export { App };

const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const checkSession = async () => {
  DEBUG && console.log("Setting up session check interval");
  const interval = setInterval(() => {
     if (window.location.pathname === "/login") {
      return;
    }
    void (async () => {
      DEBUG && console.log("Checking session validity...");
      const sessionValid = await handleInvalidSession();
      DEBUG && console.log("Session:", sessionValid);
      if (!sessionValid) {
        window.location.href = "/login";
        notifications.show({
          title: "Session Expired",
          message: "Your session has expired. Please log in again.",
          color: "red",
        });
      }
    })();
  }, SESSION_CHECK_INTERVAL_MS);
  return () => clearInterval(interval);
};

const App = () => {
  useEffect(() => {
    checkSession();
  }, []);

  return (
    <BrowserRouter>
      <AppShell header={{ height: 64 }} padding="md">
        <AppShell.Header>
          <Navbar />
        </AppShell.Header>
        <AppShell.Main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auction/:id" element={<AuctionDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  );
};

export default App;
