import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Body from "./Body";
import StationInfo from "./StationInfo";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";
import HowItWorks from "./HowItWorks";
import { WebSocketProvider, useWebSocket } from "./WebSocketProvider";

function StationPage() {
  const { buffer, virtualNow } = useWebSocket();
  const isBufferEmpty = !buffer || buffer.length === 0;

  return (
    <Body>
      <StationInfo />
      {!isBufferEmpty && (
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            width: "100%",
          }}
        >
          <SeismoPlot buffer={buffer} virtualNow={virtualNow} />
          <Spectrogram buffer={buffer} virtualNow={virtualNow} bufferSizeSec={30} />
        </div>
      )}
    </Body>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/prometheus" replace />} />
      <Route path="/prometheus" element={<StationPage />} />
      <Route path="/gaia" element={<StationPage />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
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
