import React from "react";
import Header from "./Header";
import Body from "./Body";
import StationInfo from "./StationInfo";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";
import { useWebSocket } from "./WebSocketProvider";

function App() {
  const { buffer, virtualNow } = useWebSocket();
  const isBufferEmpty = !buffer || buffer.length === 0;
  return (
    <>
    <Header />
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
    </>  
  );
}

export default App;
