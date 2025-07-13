import React from "react";
import { WebSocketProvider, useWebSocket } from "./WebSocketProvider";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";
import Body from "./Body";
import Header from "./Header";

function Status() {
  const { connected } = useWebSocket();
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <p>Status: {connected ? "Connected ✅" : "Disconnected ❌"}</p>
    </div>
  );
}

function App() {
  const { buffer, virtualNow } = useWebSocket();
  const isBufferEmpty = !buffer || buffer.length === 0;
  return (
    <WebSocketProvider url="wss://seismologos.shop/ws/user">
      <Header/>
      <Body>
        <Status/>
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
    </WebSocketProvider>
  );
}

export default App;
