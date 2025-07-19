import React, { useEffect, useState } from "react";
import { Page404 } from "./Page404";
import { PageLoading } from "./PageLoading";
import { PageServerError } from "./PageServerError";
import { PageUnableToConnect } from "./PageUnableToConnect";
import { useWebSocket } from "./WebSocketProvider";
import styles from "./stationInfo.module.css";
import SeismoPlot from "./SeismoPlot";
import Spectrogram from "./Spectrogram";

function Station() {
  const modeClasses = {
    Testing: styles.modeTesting,
    Deployed: styles.modeDeployed,
    Retired: styles.modeRetired,
  };

  const { connected, isConnecting, gpsSynced, stations, buffer, virtualNow } =
    useWebSocket();

  const [timedOut, setTimedOut] = useState(false);

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

  if (timedOut) {
    return <PageServerError />;
  }

  if (isConnecting || !stations) {
    return <PageLoading />;
  }

  if (!connected && !isConnecting) {
    return <PageUnableToConnect />;
  }

  const info = stations.find(
    (station) => station.name === window.location.pathname.replace("/", "")
  );

  if (info == null) {
    return <Page404 />;
  }

  const isBufferEmpty = !buffer || buffer.length === 0;

  return (
    <div className={styles.wrapper}>
      {/* Wrap info and status side by side */}
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

        <div className={styles.statusWrapper}>
          {connected && (
            <div>
              {info.connected ? (
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

      {buffer && buffer.length > 0 && (
        <>
          <div className={styles.seismoPlotWrapper}>
            <SeismoPlot buffer={buffer} virtualNow={virtualNow} />
          </div>
          <div className={styles.seismoPlotWrapper}>
            <Spectrogram
              buffer={buffer}
              virtualNow={virtualNow}
              bufferSizeSec={30}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Station;
