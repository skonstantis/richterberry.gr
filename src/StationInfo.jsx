import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "./WebSocketProvider";
import styles from "./stationInfo.module.css";

function StationInfo() {
  const modeClasses = {
    Testing: styles.modeTesting,
    Deployed: styles.modeDeployed,
    Retired: styles.modeRetired,
  };

  const { connected, isConnecting, gpsSynced, stations, error } =
    useWebSocket();

  if (error) return <div>Server down</div>;
  
  const info =
    stations == null
      ? null
      : stations.find((station) => station.name === "prometheus");

  return (
    <div className={styles.wrapper}>
      {stations != null && (
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
              className={`${styles.modeWrapper} ${
                modeClasses[info.mode] || ""
              }`}
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
            <div className={styles.stationWrapper}>
              {info.name.toUpperCase()}
            </div>
            <img
              src={"./" + info.id + ".svg"}
              alt="Id"
              className={styles.idIcon}
            />
          </div>
          <div className={styles.stationType}>{info.type}</div>
        </div>
      )}
      <div className={styles.statusWrapper}>
        <img
          src={"./client-connected.svg"}
          alt="Client"
          className={styles.statusIcons}
        />
        {isConnecting ? (
          <img
            src={"./server-connecting.svg"}
            alt="Server"
            className={styles.statusIcons}
          />
        ) : connected ? (
          <img
            src={"./server-connected.svg"}
            alt="Server"
            className={styles.statusIcons}
          />
        ) : (
          <img
            src={"./server-disconnected.svg"}
            alt="Server"
            className={styles.statusIcons}
          />
        )}
        {connected && (
          <div>
            {stations != null || info.connected ? (
              info.connected ? (
                <img
                  src={"./station-connected.svg"}
                  alt="Station"
                  className={styles.statusIcons}
                />
              ) : (
                <img
                  src={"./station-disconnected.svg"}
                  alt="Station"
                  className={styles.statusIcons}
                />
              )
            ) : (
              <img
                src={"./station-connecting.svg"}
                alt="Station"
                className={styles.statusIcons}
              />
            )}
          </div>
        )}
        {connected && info.connected && (
          <div>
            {gpsSynced ? (
              <img
                src={"./gps-connected.svg"}
                alt="GPS"
                className={styles.statusIcons}
              />
            ) : (
              <img
                src={"./gps-disconnected.svg"}
                alt="GPS"
                className={styles.statusIcons}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StationInfo;
