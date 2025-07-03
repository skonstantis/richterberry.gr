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

  const max_reconnect_delay = 30000;
  const bufferSizeMs = 30000;

  const [connected, setConnected] = useState(false);
  const [samples, setSamples] = useState([]);

  const bufferRef = useRef([]);

  const virtualTimeBaseRef = useRef(null);
  const lastSyncMonotonicRef = useRef(null);

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
        try {
          const packet = JSON.parse(event.data);

          if (!packet.samples || !Array.isArray(packet.samples)) {
            console.warn("Received packet without samples", packet);
            return;
          }

          if (packet.sample_rate > 0 && packet.samples.length > 0) {
            const batchDurationMs = (packet.samples.length / packet.sample_rate) * 1000;
            const batchStartMs = new Date(packet.timestamp_start).getTime();
            const batchEndMs = batchStartMs + batchDurationMs;

            const oldVirtualTimeBase = virtualTimeBaseRef.current;
            
            if (oldVirtualTimeBase !== null && batchEndMs < oldVirtualTimeBase) {
              console.log(`[INFO] GPS time moved backward: ${new Date(oldVirtualTimeBase).toISOString()} → ${new Date(batchEndMs).toISOString()}`);
            }

            virtualTimeBaseRef.current = batchEndMs;
            lastSyncMonotonicRef.current = performance.now();

            console.log(`[GPS SYNC] virtualTimeBase=${new Date(batchEndMs).toISOString()}, monotonic=${lastSyncMonotonicRef.current.toFixed(2)}ms`);
          }

          const incomingSamples = packet.samples.map(s => ({
            timestamp: s.timestamp * 1000,
            value: s.value,
          }));

          const buffer = bufferRef.current;
          const maxBufferTimestamp = buffer.length > 0 ? buffer[buffer.length - 1].timestamp : -Infinity;

          const firstNewSampleIndex = incomingSamples.findIndex(s => s.timestamp > maxBufferTimestamp);
          if (firstNewSampleIndex === -1) {
            console.log(`Incoming batch fully overlaps buffer, ignoring`);
            return;
          }

          const trimmedSamples = incomingSamples.slice(firstNewSampleIndex);
          bufferRef.current = buffer.concat(trimmedSamples);

          console.log(
            `Received ${incomingSamples.length} samples, trimmed to ${trimmedSamples.length}, buffer size now ${bufferRef.current.length}`
          );
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
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

    const delay = Math.min(3000 * 2 ** reconnectAttempts.current, max_reconnect_delay);
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

  const getVirtualTimeNow = () => {
    if (virtualTimeBaseRef.current === null || lastSyncMonotonicRef.current === null) {
      return null;
    }
    const elapsed = performance.now() - lastSyncMonotonicRef.current;
    return virtualTimeBaseRef.current + elapsed;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const nowVirtualTime = getVirtualTimeNow();
      if (nowVirtualTime !== null) {
        bufferRef.current = bufferRef.current.filter(
          sample => sample.timestamp >= nowVirtualTime - bufferSizeMs
        );
      }
      setSamples([...bufferRef.current]);
    }, 100); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    connectWebSocket();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.log("Tab hidden, disconnecting WebSocket...");
        disconnectWebSocket();
        bufferRef.current = [];
        setSamples([]);
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
    <WebSocketContext.Provider value={{ connected, samples, getVirtualTimeNow }}>
      {children}
    </WebSocketContext.Provider>
  );
}
