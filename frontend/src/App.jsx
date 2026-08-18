import React, { useState, useEffect } from 'react';
import PageContainer from './components/layout/PageContainer';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import HistoryPage from './pages/HistoryPage';

/**
 * GENERATIVE AI FOR EVERYONE — Main Application Entry & Router
 * Art Deco / "Gatsby" Design System Foundation
 */
export default function App() {
  const [activePage, setActivePage] = useState('landing'); // 'landing' | 'login' | 'register' | 'dashboard' | 'workspace' | 'history'

  const handleNavigate = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageContainer>
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      <main className="min-h-[80vh]">
        {activePage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {activePage === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {activePage === 'register' && <RegisterPage onNavigate={handleNavigate} />}
        {activePage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {activePage === 'workspace' && <WorkspacePage onNavigate={handleNavigate} />}
        {activePage === 'history' && <HistoryPage onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </PageContainer>
  );
}
