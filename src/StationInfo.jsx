import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "./WebSocketProvider";
import styles from "./stationInfo.module.css";

function Health() {
  const { connected, gpsSynced, stationConnected, isConnecting } =
    useWebSocket();

  const [timeoutOver, setTimeoutOver] = useState(false);
  const timeoutIdRef = useRef(null);

  const clearExistingTimeout = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  useEffect(() => {
    const startTimeout = () => {
      clearExistingTimeout();
      setTimeoutOver(false);
      timeoutIdRef.current = setTimeout(() => {
        setTimeoutOver(true);
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearExistingTimeout();
        setTimeoutOver(true);
        console.log("Visibility hidden — timeout forced end");
      } else {
        if (connected) {
          startTimeout();
        }
      }
    };

    if (connected) {
      startTimeout();
    } else {
      clearExistingTimeout();
      setTimeoutOver(false);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearExistingTimeout();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connected]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <div className={styles.locationWrapper}>
          <img
            src={"./location-icon.svg"}
            alt="Location"
            className={styles.locationIcon}
          />
          Athens Central
        </div>
        <div className={styles.stateWrapper}>
          <img
            src={"./settings-icon.svg"}
            alt="State"
            className={styles.settingsIcon}
          />
          Test Mode
        </div>
      </div>
      <div className={styles.row}>
      <div className={styles.stationWrapper}>PROMETHEUS</div>
        <img src={"./GR000.svg"} alt="Id" className={styles.idIcon} />
      </div>
      <div className={styles.stationHeading}>
        High-Resolution Real-Time Seismic Station
      </div>
      <p>
        Client connection:{" "}
        {isConnecting ? "connecting..." : connected ? "good" : "disconnected"}
      </p>
      {connected && (
        <p>
          Station connection:{" "}
          {timeoutOver || stationConnected
            ? stationConnected
              ? "good"
              : "disconnected"
            : "connecting..."}
        </p>
      )}

      {connected && stationConnected && (
        <p>GPS synced timestamps: {gpsSynced ? "yes" : "no"}</p>
      )}
    </div>
  );
}

export default Health;
