import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import PageContainer from './components/layout/PageContainer';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import HistoryPage from './pages/HistoryPage';

import ErrorBoundary from './components/ui/ErrorBoundary';

/**
 * GENERATIVE AI FOR EVERYONE — Main Application Entry & Router
 *
 * Uses a simple page-key router (no react-router) with optional navState
 * so pages can pass context between them (e.g. projectId from dashboard → workspace).
 *
 * Art Deco / "Gatsby" Design System — obsidian #0A0A0A, champagne #F2F0E4, gold #D4AF37
 */
export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [navState, setNavState]     = useState({});

  /**
   * Navigate to a page, optionally passing state context.
   * @param {string} page  - One of: 'landing' | 'login' | 'register' | 'dashboard' | 'workspace' | 'history'
   * @param {object} state - Optional context (e.g. { projectId, projectTitle, goal })
   */
  const handleNavigate = (page, state = {}) => {
    setActivePage(page);
    setNavState(state);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <PageContainer>
        <Navbar activePage={activePage} onNavigate={handleNavigate} />

        <main className="min-h-[80vh]">
          <ErrorBoundary fallbackTitle="Page Error Recovered" onReset={() => setActivePage('dashboard')}>
            {activePage === 'landing'   && <LandingPage   onNavigate={handleNavigate} />}
            {activePage === 'login'     && <LoginPage     onNavigate={handleNavigate} />}
            {activePage === 'register'  && <RegisterPage  onNavigate={handleNavigate} />}
            {activePage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {activePage === 'workspace' && <WorkspacePage onNavigate={handleNavigate} navState={navState} />}
            {activePage === 'history'   && <HistoryPage   onNavigate={handleNavigate} navState={navState} />}
          </ErrorBoundary>
        </main>

        <Footer onNavigate={handleNavigate} />
      </PageContainer>
    </AuthProvider>
  );
}