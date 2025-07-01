import React, { useEffect, useRef } from "react";

function App() {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket("wss://seismologos.shop/ws/user");

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      console.log(event.data);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  return (
    <div>
      <h2>Seismologos User Messages (check console)</h2>
      <p>Open the browser console to see incoming WebSocket messages.</p>
    </div>
  );
}

export default App;
