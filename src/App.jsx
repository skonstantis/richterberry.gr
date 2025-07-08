import React from "react";
import { WebSocketProvider, useWebSocket } from "./WebSocketProvider";
import SeismoPlot from "./SeismoPlot";

function Status() {
  const { connected, buffer, virtualNow } = useWebSocket();

  return (
    <div>
      <h2>WebSocket Status</h2>
      <p>Status: {connected ? "Connected ✅" : "Disconnected ❌"}</p>
      <SeismoPlot buffer={buffer} virtualNow={virtualNow} />
    </div>
  );
}

function App() {
  return (
    <WebSocketProvider url="wss://seismologos.shop/ws/user">
        <Status />
    </WebSocketProvider>
  );
}

export default App;
