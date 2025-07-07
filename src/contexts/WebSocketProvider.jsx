import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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

  const [virtualTimeBase, setVirtualTimeBase] = useState(null);

  const intervalRef = useRef(null);

  const pendingSamplesRef = useRef([]);

  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      if (
        ws.current &&
        ws.current.readyState !== WebSocket.CLOSED &&
        ws.current.readyState !== WebSocket.CLOSING
      ) {
        resolve();
        return;
      }
  
      console.log("Attempting WebSocket connection...");
      isManuallyClosed.current = false;
      ws.current = new WebSocket("wss://seismologos.shop/ws/user");
  
      ws.current.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;
        setConnected(true);
        resolve();
      };
  
      ws.current.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
  
          if (!packet.samples || !Array.isArray(packet.samples)) {
            console.warn("Received packet without samples", packet);
            return;
          }
  
          if (packet.sample_rate > 0 && packet.samples.length > 0) {
            const batchDurationMs =
              (packet.samples.length / packet.sample_rate) * 1000;
            const batchStartMs = new Date(packet.timestamp_start).getTime();
            const batchEndMs = batchStartMs + batchDurationMs;
  
            if (virtualTimeBase !== null && batchEndMs < virtualTimeBase) {
              console.log(
                `[INFO] GPS time moved backward: ${new Date(
                  virtualTimeBase
                ).toISOString()} → ${new Date(batchEndMs).toISOString()}`
              );
            }
  
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
  
            setVirtualTimeBase(batchEndMs);
  
            let intervalCount = 1;
            const delay = 200;
  
            intervalRef.current = setInterval(() => {
              setVirtualTimeBase(batchEndMs + delay * intervalCount);
              intervalCount += 1;
            }, delay);
  
            // console.log(`[GPS SYNC] virtualTimeBase=${new Date(batchEndMs).toISOString()}`);
          }
  
          const incomingSamples = packet.samples.map((s) => ({
            timestamp: s.timestamp * 1000,
            value: s.value,
          }));
  
          const buffer = bufferRef.current;
  
          if (buffer.length === 0) {
            pendingSamplesRef.current = pendingSamplesRef.current.concat(incomingSamples);
            console.log(
              `Buffer empty, accumulating ${incomingSamples.length} samples in pendingSamplesRef (total pending: ${pendingSamplesRef.current.length})`
            );
            return;
          }
  
          if (pendingSamplesRef.current.length > 0) {
            const combinedSamples = pendingSamplesRef.current.concat(incomingSamples);
  
            const maxBufferTimestamp =
              buffer.length > 0 ? buffer[buffer.length - 1].timestamp : -Infinity;
  
            const firstNewSampleIndex = combinedSamples.findIndex(
              (s) => s.timestamp > maxBufferTimestamp
            );

            if (firstNewSampleIndex === -1) {
              console.log(`Combined batch fully overlaps buffer, ignoring`);
              pendingSamplesRef.current = [];
              return;
            }
  
            const trimmedSamples = combinedSamples.slice(firstNewSampleIndex);
  
            bufferRef.current = buffer.concat(trimmedSamples);
            pendingSamplesRef.current = [];
  
            console.log(
              `Merged ${combinedSamples.length} pending + incoming samples, trimmed to ${trimmedSamples.length}, buffer size now ${bufferRef.current.length}`
            );
            return;
          }
  
          const maxBufferTimestamp =
            buffer.length > 0 ? buffer[buffer.length - 1].timestamp : -Infinity;
  
          const firstNewSampleIndex = incomingSamples.findIndex(
            (s) => s.timestamp > maxBufferTimestamp
          );
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
        if (
          document.visibilityState === "visible" &&
          !isManuallyClosed.current
        ) {
          scheduleReconnect();
        }
      };
  
      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.close();
        }
        reject(error);
      };
    });
  };
  

  const scheduleReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    const delay = Math.min(
      3000 * 2 ** reconnectAttempts.current,
      max_reconnect_delay
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
    const interval = setInterval(() => {
      if (virtualTimeBase === null) return;

      const nowVirtualTime = virtualTimeBase;

      bufferRef.current = bufferRef.current.filter(
        (sample) => sample.timestamp >= nowVirtualTime - bufferSizeMs
      );

      setSamples([...bufferRef.current]);
    }, 100);

    return () => clearInterval(interval);
  }, [virtualTimeBase]);

  useEffect(() => {
    async function setup() {
      await connectWebSocket();
      fetchInitialBuffer();
    }
    setup();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        console.log("Tab hidden, disconnecting WebSocket...");
        disconnectWebSocket();
        bufferRef.current = [];
        setSamples([]);
        setVirtualTimeBase(null);
        intervalRef.current ? clearInterval(intervalRef.current) : "";
        intervalRef.current = null;
      } else if (document.visibilityState === "visible") {
        console.log("Tab visible, reconnecting WebSocket...");

        await connectWebSocket();
        fetchInitialBuffer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disconnectWebSocket();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchInitialBuffer = async () => {
    try {
      const response = await fetch("https://seismologos.shop/buffer");
      const data = await response.json();

      if (Array.isArray(data.samples)) {
        const getSamples = data.samples.map((s) => ({
          timestamp: s.timestamp * 1000,
          value: s.value,
        }));

        const existingBuffer = bufferRef.current;
        const existingMaxTimestamp =
          existingBuffer.length > 0
            ? existingBuffer[existingBuffer.length - 1].timestamp
            : -Infinity;

        const filteredGetSamples = getSamples.filter(
          (s) => s.timestamp > existingMaxTimestamp
        );

        bufferRef.current = existingBuffer.concat(filteredGetSamples);

        setSamples([...bufferRef.current]);

        const lastSample = bufferRef.current[bufferRef.current.length - 1];
        if (lastSample) {
          setVirtualTimeBase(lastSample.timestamp);
          console.log(
            "[INIT] Buffer loaded, last sample at",
            new Date(lastSample.timestamp).toISOString()
          );
        }
      }
    } catch (err) {
      console.error("[INIT] Failed to fetch buffer:", err);
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, samples, virtualTimeBase }}>
      {children}
    </WebSocketContext.Provider>
  );
}
