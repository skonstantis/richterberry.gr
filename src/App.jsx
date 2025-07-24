import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Station from "./Station";
import Panel from "./Panel";
import HowItWorks from "./HowItWorks";
import { WebSocketProvider } from "./WebSocketProvider";
import Map from "./Map.jsx";

function AppRoutes({bufferSizeSec, setBufferSizeSec}) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/prometheus" replace />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/panel" element={<Panel />} />
      <Route path="/map" element={<Map />} />
      <Route path="*" element={<Station bufferSizeSec={bufferSizeSec} setBufferSizeSec={setBufferSizeSec}/>} />
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();
  const [bufferSizeSec, setBufferSizeSec] = useState(() => {
    const saved = localStorage.getItem("bufferSizeSec");
    return saved ? Number(saved) : 300; 
  });

  return (
    <WebSocketProvider key={`${location.pathname}-${bufferSizeSec}`} url="wss://seismologos.shop/ws/user" bufferSizeSec={bufferSizeSec}>
      <Header />
      <AppRoutes bufferSizeSec={bufferSizeSec} setBufferSizeSec={setBufferSizeSec}/>
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
