import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Station from "./Station";
import HowItWorks from "./HowItWorks";
import { WebSocketProvider } from "./WebSocketProvider";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/prometheus" replace />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="*" element={<Station />} />
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <WebSocketProvider key={location.pathname} url="wss://seismologos.shop/ws/user">
      <Header />
      <AppRoutes />
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
