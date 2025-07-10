import React from "react";
import { WebSocketProvider, useWebSocket } from "./WebSocketProvider";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";

function Status() {
  const { connected, buffer, virtualNow } = useWebSocket();

  const isBufferEmpty = !buffer || buffer.length === 0;

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <p>Status: {connected ? "Connected ✅" : "Disconnected ❌"}</p>
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
