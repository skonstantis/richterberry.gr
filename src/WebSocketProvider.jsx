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

  const [isConnecting, setIsConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [gpsSynced, setGpsSynced] = useState(false);
  const [firstMessage, setFirstMessage] = useState(false);
  const [stations, setStations] = useState(null);
  const [error, setError] = useState(false);
  const stationsRef = useRef(null);

  const { addBatch, buffer, virtualNow } = useBuffer(bufferSizeSec, firstMessage);

  const stationTimeoutRef = useRef(null);

  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const isFetchingStations = useRef(false);

  const isTabVisible = useRef(!document.hidden);
  const MAX_BACKOFF_DELAY = 30000;
  const STATION_DISCON_TIMEOUT = 5000;
  const FETCH_STATIONS_TIMEOUT = 10000;

  const fetchStations = async () => {
    if (isFetchingStations.current) {
      console.log("Previous fetch still running, skipping this one.");
      return;
    }
  
    isFetchingStations.current = true;
  
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_STATIONS_TIMEOUT);
  
    try {
      const response = await fetch("https://seismologos.shop/stations", {
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        setError(true);
        return;
      }
  
      const data = await response.json();
      setStations(data.stations);
      stationsRef.current = data;
    } catch (err) {
      if (err.name === "AbortError") {
        console.error("Fetch aborted due to timeout");
        setError(true);
      } else {
        console.error("Error fetching stations data:", err);
        setError(true);
      }
    } finally {
      isFetchingStations.current = false;
    }
  };
  

  const refreshStationTimeout = () => {
    if (stationTimeoutRef.current) {
      clearTimeout(stationTimeoutRef.current);
    }

    stationTimeoutRef.current = setTimeout(() => {
      setGpsSynced(false);
    }, STATION_DISCON_TIMEOUT);
  };

  useEffect(() => {
    let intervalId = null;

    const startFetching = () => {
      fetchStations(); 
      intervalId = setInterval(fetchStations, 1000);
    };

    const stopFetching = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      setStations(null);
      stationsRef.current = null;
    };

    if (isTabVisible.current) {
      startFetching();
    }

    const handleVisibilityChange = () => {
      isTabVisible.current = !document.hidden;
      if (isTabVisible.current) {
        startFetching();
      } else {
        stopFetching();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopFetching();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(stationTimeoutRef.current);
    };
  }, []);

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

    setIsConnecting(true);
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      setIsConnecting(false);
      reconnectAttempts.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        if (stationsRef.current == null) return;
        const data = JSON.parse(event.data);
        if (data.type === "data") {
          if (!firstMessage) setFirstMessage(true);
          refreshStationTimeout();
          setGpsSynced(data.gps_synced);
          if (Array.isArray(data.samples) && data.samples.length > 0) {
            addBatch(data.samples);
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    socket.onclose = () => {
      console.warn("WebSocket closed");
      setConnected(false);
      setIsConnecting(false);
      if (shouldReconnect.current && isTabVisible.current) {
        attemptReconnect();
      }
    };

    socket.onerror = () => {
      console.error("WebSocket error");
      setIsConnecting(false);
      socket.close();
    };
  };

  const attemptReconnect = () => {
    const attempt = reconnectAttempts.current;
    const delay =
      attempt < 10
        ? Math.min(1000 * 2 ** attempt, MAX_BACKOFF_DELAY)
        : MAX_BACKOFF_DELAY;

    console.log(`WebSocket: Reconnecting in ${delay / 1000}s (attempt #${attempt + 1})`);

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
        setConnected(false);
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
        gpsSynced,
        buffer,
        virtualNow,
        isConnecting,
        error,
        stations
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
