import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

export function App() {
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
}

export default App;
