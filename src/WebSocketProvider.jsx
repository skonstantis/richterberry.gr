import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useBuffer } from "./useBuffer"; 

const WebSocketContext = createContext({
  connected: false,
  buffer: [], 
  virtualNow: null, 
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ url, children, bufferSizeSec = 30 }) {
  const ws = useRef(null);

  const [connected, setConnected] = useState(false);
  const [firstMessage, setFirstMessage] = useState(false);
  const { addBatch, buffer, virtualNow} = useBuffer(bufferSizeSec, firstMessage);

  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);

  const isTabVisible = useRef(!document.hidden);
  const MAX_BACKOFF_DELAY = 30000;

  const cleanupWebSocket = () => {
    if (ws.current) {
      setFirstMessage(false);
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      if (ws.current.readyState < 2) {
        ws.current.close();
      }
      ws.current = null;
    }
  };

  const connect = () => {
    if (!shouldReconnect.current) return;
    if (!isTabVisible.current) return;

    cleanupWebSocket();

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        if(!firstMessage)
          setFirstMessage(true);
        const data = JSON.parse(event.data);

        if (Array.isArray(data.samples) && data.samples.length > 0) {
          addBatch(data.samples);
        }

      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    socket.onclose = () => {
      console.warn("WebSocket closed");
      setConnected(false);
      if (shouldReconnect.current && isTabVisible.current) {
        attemptReconnect();
      }
    };

    socket.onerror = () => {
      console.error("WebSocket error");
      socket.close();
    };
  };

  const attemptReconnect = () => {
    const attempt = reconnectAttempts.current;
    const delay =
      attempt < 10
        ? Math.min(1000 * 2 ** attempt, MAX_BACKOFF_DELAY)
        : MAX_BACKOFF_DELAY;

    console.log(
      `WebSocket: Reconnecting in ${delay / 1000}s (attempt #${attempt + 1})`
    );

    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      connect();
    }, delay);
  };

  useEffect(() => {
    shouldReconnect.current = true;

    const handleVisibilityChange = () => {
      isTabVisible.current = !document.hidden;

      if (isTabVisible.current) {
        console.log("Tab visible — connecting WebSocket");
        shouldReconnect.current = true;
        connect();
      } else {
        console.log("Tab hidden — closing WebSocket");
        shouldReconnect.current = false;
        clearTimeout(reconnectTimeout.current);
        cleanupWebSocket();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (isTabVisible.current) {
      connect();
    }

    return () => {
      shouldReconnect.current = false;
      clearTimeout(reconnectTimeout.current);
      cleanupWebSocket();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [url]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        buffer,
        virtualNow,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

