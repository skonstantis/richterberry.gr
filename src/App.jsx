import React from "react";
import { WebSocketProvider, useWebSocket } from "./contexts/WebSocketProvider";
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
  const { lastMessage } = useWebSocket();

  return (
    <div>
      <h2>Seismologos User Messages (check console)</h2>
      <p>Open the browser console to see incoming WebSocket messages.</p>
      {lastMessage && (
        <div>
          <strong>Last Message:</strong> {lastMessage}
        </div>
      )}
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
