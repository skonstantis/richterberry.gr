import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Station from "./Station";
import HowItWorks from "./HowItWorks";
import { WebSocketProvider } from "./WebSocketProvider";

function AppRoutes({bufferSizeSec}) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/prometheus" replace />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="*" element={<Station bufferSizeSec={bufferSizeSec}/>} />
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();
  const bufferSizeSec = 30;

  return (
    <WebSocketProvider key={location.pathname} url="wss://seismologos.shop/ws/user" bufferSizeSec={bufferSizeSec}>
      <Header />
      <AppRoutes bufferSizeSec={bufferSizeSec}/>
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
