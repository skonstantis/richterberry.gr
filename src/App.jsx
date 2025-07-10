import React from "react";
import { WebSocketProvider, useWebSocket } from "./WebSocketProvider";
import SeismoPlot from "./SeismoPlot";
import EmptySeismoPlot from "./EmptySeismoPlot";
import Spectrogram from "./Spectrogram";

function Status() {
  const { connected, buffer, virtualNow } = useWebSocket();

  const isBufferEmpty = !buffer || buffer.length === 0;

  return (
    <div>
      <h2>WebSocket Status</h2>
      <p>Status: {connected ? "Connected ✅" : "Disconnected ❌"}</p>
      {isBufferEmpty ? (
        <EmptySeismoPlot />
      ) : (
        <>
        <SeismoPlot buffer={buffer} virtualNow={virtualNow} />
        <Spectrogram buffer={buffer} virtualNow={virtualNow} bufferSizeSec={30} />
        </>
      )}
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
