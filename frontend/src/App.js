import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ResearchPaper from './components/ResearchPaper';
import GlobalView from './components/GlobalView';
import Chatbot from './components/Chatbot';
import ClimateClock from './components/ClimateClock';
import './App.css';

const AppShell = () => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    if (location.key === 'default') {
      return undefined;
    }

    setIsRouteLoading(true);
    const timer = setTimeout(() => setIsRouteLoading(false), 480);

    return () => clearTimeout(timer);
  }, [location.pathname, location.key]);

  return (
    <div className="App">
      <div className="ambient-glow ambient-glow-top" />
      <div className="ambient-glow ambient-glow-bottom" />

      {isRouteLoading && (
        <div className="page-transition-loader" role="status" aria-live="polite" aria-label="Changing page">
          <div className="page-transition-loader-content">
            <div className="page-transition-orb" />
            <p>Loading page...</p>
          </div>
        </div>
      )}

      <Navbar />
      <ClimateClock />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/research" element={<ResearchPaper />} />
          <Route path="/global" element={<GlobalView />} />
        </Routes>
      </div>
      <Chatbot />
    </div>
  );
};

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isBootFade, setIsBootFade] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsBootFade(true), 1300);
    const finishTimer = setTimeout(() => setIsBooting(false), 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  if (isBooting) {
    return (
      <div className={`app-loader-screen ${isBootFade ? 'fade-out' : ''}`} role="status" aria-live="polite">
        <div className="app-loader-content">
          <div className="app-loader-orb" />
          <h1>CarbonSense India</h1>
          <p>Preparing climate intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;