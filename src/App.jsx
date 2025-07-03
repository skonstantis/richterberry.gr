import React from "react";
import { WebSocketProvider, useWebSocket } from "./contexts/WebSocketProvider";
import { SimpleLinePlot } from "./components/SimpleLinePlot"
import "./styles.css";

function Overlay() {
  const { connected, overlayText } = useWebSocket();

  if (connected) return null;

  return (
    <div className="overlay">
      {overlayText || "Connecting to server..."}  
    </div>
  );
}

function AppContent() {
  const { connected, samples, getVirtualTimeNow } = useWebSocket();

  return (
    <div>
      <h2>Seismograph Plot (Last 30 sec)</h2>
      {!connected && <p>Disconnected...</p>}
      <SimpleLinePlot samples={samples} getVirtualTimeNow={getVirtualTimeNow} />
    </div>
  );
}

function App() {
  return (
    <WebSocketProvider>
      <AppContent />
      <Overlay />
    </WebSocketProvider>
  );
}

export default App;
