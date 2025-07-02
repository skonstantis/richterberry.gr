import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext();

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const isManuallyClosed = useRef(false);

  const MAX_RECONNECT_DELAY = 30000; 

  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const connectWebSocket = () => {
    if (
      !ws.current ||
      ws.current.readyState === WebSocket.CLOSED ||
      ws.current.readyState === WebSocket.CLOSING
    ) {
      console.log("Attempting WebSocket connection...");
      isManuallyClosed.current = false;
      ws.current = new WebSocket("wss://seismologos.shop/ws/user");

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        setLastMessage(event.data);
        console.log("WS message:", event.data);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        if (document.visibilityState === "visible" && !isManuallyClosed.current) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.close();
        }
      };
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    const delay = Math.min(
      3000 * 2 ** reconnectAttempts.current,
      MAX_RECONNECT_DELAY
    );
    console.log(`Reconnecting in ${delay / 1000} seconds...`);

    reconnectTimer.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      connectWebSocket();
    }, delay);
  };

  const disconnectWebSocket = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      isManuallyClosed.current = true;
      ws.current.close();
    }
  };

  useEffect(() => {
    connectWebSocket();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.log("Tab hidden, disconnecting WebSocket...");
        disconnectWebSocket();
      } else if (document.visibilityState === "visible") {
        console.log("Tab visible, reconnecting WebSocket...");
        connectWebSocket();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disconnectWebSocket();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}
