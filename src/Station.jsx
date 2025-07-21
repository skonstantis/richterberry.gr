import React, { useEffect, useState } from "react";
import { Page404 } from "./Page404";
import { PageLoading } from "./PageLoading";
import { PageError } from "./PageError";
import { PageUnableToConnect } from "./PageUnableToConnect";
import { useWebSocket } from "./WebSocketProvider";
import styles from "./station.module.css";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";

function Station({ bufferSizeSec, setBufferSizeSec }) {
  const modeClasses = {
    Testing: styles.modeTesting,
    Deployed: styles.modeDeployed,
    Retired: styles.modeRetired,
  };

  const { connected, isConnecting, gpsSynced, stations, buffer, virtualNow } =
    useWebSocket();

  const [timedOut, setTimedOut] = useState(false);

  const info = stations
    ? stations.find(
        (station) => station.name === window.location.pathname.replace("/", "")
      )
    : null;

  useEffect(() => {
    if (info && info.name) {
      const capitalized =
        info.name.charAt(0).toUpperCase() + info.name.slice(1);
      document.title = `${capitalized} - RichterBerry`;
    } else {
      document.title = "RichterBerry";
    }
  }, [info]);

  useEffect(() => {
    if (stations || !isConnecting) {
      setTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setTimedOut(true);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isConnecting, stations]);

  if (timedOut || !(bufferSizeSec === 30 || bufferSizeSec === 300)) {
    return <PageError />;
  }

  if (isConnecting || !stations) {
    return <PageLoading />;
  }

  if (!connected && !isConnecting) {
    return <PageUnableToConnect />;
  }

  if (info == null) {
    return <Page404 />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.infoAndStatus}>
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
                className={styles.modeIcon}
              />
              {info.mode}
            </div>
          </div>
          <div className={styles.row}>
            <div
              className={
                info.connected ? styles.statusOnline : styles.statusOffline
              }
            >
               <img
                src={"./station.svg"}
                alt="GPS"
                className={styles.stationIcon}
              />
              {info.connected ? "Online" : "Offline"}
            </div>
            {info.connected && gpsSynced && <div
              className={
                gpsSynced ? styles.statusOnline : styles.statusOffline
              }
            >
              <img
                src={"./gps.svg"}
                alt="GPS"
                className={styles.gpsIcon}
              />
              {info.connected ? "Synced" : "Unsynced"}
            </div>}
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
      </div>

      {buffer && buffer.length > 0 && (
        <>
          <div className={styles.bufferControls}>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.bufferButton} ${
                  bufferSizeSec === 30 ? styles.active : ""
                }`}
                onClick={() => {
                  setBufferSizeSec(30);
                  localStorage.setItem("bufferSizeSec", "30");
                }}
              >
                30s @ 250Hz
              </button>
              <button
                className={`${styles.bufferButton} ${
                  bufferSizeSec === 300 ? styles.active : ""
                }`}
                onClick={() => {
                  setBufferSizeSec(300);
                  localStorage.setItem("bufferSizeSec", "300");
                }}
              >
                5m @ 50Hz
              </button>
            </div>
          </div>

          <div className={styles.seismoPlotWrapper}>
            <SeismoPlot
              buffer={buffer}
              virtualNow={virtualNow}
              bufferSizeSec={bufferSizeSec}
            />
          </div>
          <div className={styles.seismoPlotWrapper}>
            <Spectrogram
              buffer={buffer}
              virtualNow={virtualNow}
              bufferSizeSec={bufferSizeSec}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Station;
