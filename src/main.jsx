import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { WebSocketProvider } from "./WebSocketProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WebSocketProvider url="wss://seismologos.shop/ws/user">
      <App />
    </WebSocketProvider>
  </StrictMode>
);
