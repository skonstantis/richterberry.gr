import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./Header";
import Body from "./Body";
import StationInfo from "./StationInfo";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";
import HowItWorks from "./HowItWorks";
import { useWebSocket } from "./WebSocketProvider";

function PrometheusPage() {
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
          <Spectrogram
            buffer={buffer}
            virtualNow={virtualNow}
            bufferSizeSec={30}
          />
        </div>
      )}
    </Body>
  );
}

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/prometheus" replace />} />
        <Route path="/prometheus" element={<PrometheusPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
      </Routes>
    </Router>
  );
}

export default App;