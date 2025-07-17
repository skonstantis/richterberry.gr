import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "./WebSocketProvider";
import styles from "./stationInfo.module.css";

function StationInfo() {
  const modeClasses = {
    Testing: styles.modeTesting,
    Deployed: styles.modeDeployed,
    Retired: styles.modeRetired,
  };

  const info = {
    name: "prometheus",
    id: "GR000",
    location: "Athens Central",
    mode: "Testing",
    type: "High-Resolution Real-Time Seismic Station",
  };
  const { connected, stationConnected, isConnecting, gpsSynced } =
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
      <div>
        <div className={styles.row}>
          <div className={styles.locationWrapper}>
            <img
              src={"./location-icon.svg"}
              alt="Location"
              className={styles.locationIcon}
            />
            {info.location}
          </div>
          <div
            className={`${styles.modeWrapper} ${modeClasses[info.mode] || ""}`}
          >
            <img
              src={"./mode-icon.svg"}
              alt="Mode"
              className={styles.settingsIcon}
            />
            {info.mode}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.stationWrapper}>{info.name.toUpperCase()}</div>
          <img
            src={"./" + info.id + ".svg"}
            alt="Id"
            className={styles.idIcon}
          />
        </div>
        <div className={styles.stationType}>{info.type}</div>
      </div>
      <div className={styles.statusWrapper}>
        <img src={"./client-connected.svg"} alt="Client" className={styles.statusIcons} />
        {isConnecting ? <img src={"./server-connecting.svg"} alt="Server" className={styles.statusIcons} /> : connected ? <img src={"./server-connected.svg"} alt="Server" className={styles.statusIcons} /> : <img src={"./server-disconnected.svg"} alt="Server" className={styles.statusIcons} />}
        {connected && (
          <div>
            {timeoutOver || stationConnected
              ? stationConnected
                ? <img src={"./station-connected.svg"} alt="Station" className={styles.statusIcons} />
                : <img src={"./station-disconnected.svg"} alt="Station" className={styles.statusIcons} />
              : <img src={"./station-connecting.svg"} alt="Station" className={styles.statusIcons} />}
          </div>
        )}
        {connected && stationConnected && (
          <div>{gpsSynced ? <img src={"./gps-connected.svg"} alt="GPS" className={styles.statusIcons} /> : <img src={"./gps-disconnected.svg"} alt="GPS" className={styles.statusIcons} />}</div>
        )}
      </div>
    </div>
  );
}

export default StationInfo;
