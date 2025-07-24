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
    Maintenance: styles.modeMaintenance,
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

              <div className={styles.tooltipWrapper}>
                <img
                  src={"./questionmark.svg"}
                  alt="Questionmark"
                  className={styles.questionmarkIcon}
                />
                <div className={styles.tooltip}>
                  <div className={styles.tooltipItem}>
                    <span
                      className={`${styles.tooltipBadge} ${styles.modeTesting}`}
                    ></span>
                    <span>
                      <strong>Testing</strong> Vibrations may be artificial or
                      ambient
                    </span>
                  </div>
                  <div className={styles.tooltipItem}>
                    <span
                      className={`${styles.tooltipBadge} ${styles.modeDeployed}`}
                    ></span>
                    <span>
                      <strong>Deployed</strong> Operational in the field;
                      reliable data
                    </span>
                  </div>
                  <div className={styles.tooltipItem}>
                    <span
                      className={`${styles.tooltipBadge} ${styles.modeMaintenance}`}
                    ></span>
                    <span>
                      <strong>Maintenance</strong> Temporarily offline; being
                      repaired
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.row}>
          <div
              className={
                styles.locationWrapper
              }
            >
              <img
                src={"./station.svg"}
                alt="Station"
                className={styles.stationIcon}
              />
              {info.pi}
            </div>
            <div
              className={
                styles.locationWrapper
              }
            >
              <img
                src={"./geophone.svg"}
                alt="Geophone"
                className={styles.geophoneIcon}
              />
              {info.geophones}
              <div className={styles.tooltipWrapper}>
                  <img
                    src={"./questionmark.svg"}
                    alt="Questionmark"
                    className={styles.questionmarkIcon}
                  />
                  <div className={styles.tooltip}>
                  <div className={styles.tooltipItem}>
                  <span>
  <strong>1</strong>
  <br />
  Contains a single vertical geophone<br />
  for basic seismic monitoring
  <br />
  Useful for simple installations or dense arrays
  <br />
  <br />
  <strong>3</strong>
  <br />
  Equipped with three orthogonally placed geophones<br />
  to capture full 3D ground motion (Z, N-S, E-W)
  <br />
  Offers better resolution of wave direction<br />
  and more accurate event characterization
</span>
</div>


                  </div>
                </div>
            </div>
            </div>

          <div className={styles.row}>
            <div
              className={
                info.connected ? styles.statusOnline : styles.statusOffline
              }
            >
              <img
                src={info.connected ? "./online.svg" : "./offline.svg"}
                alt="OnOffline"
                className={styles.onOfflinenIcon}
              />
              {info.connected ? "Online" : "Offline"}
            </div>
            {info.connected && gpsSynced && (
              <div
                className={
                  gpsSynced ? styles.statusOnline : styles.statusOffline
                }
              >
                <img src={"./gps.svg"} alt="GPS" className={styles.gpsIcon} />
                {info.connected ? "Synced" : "Unsynced"}
                <div className={styles.tooltipWrapper}>
                  <img
                    src={"./questionmark.svg"}
                    alt="Questionmark"
                    className={styles.questionmarkIcon}
                  />
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipItem}>
                      <span>
                        <strong>Synced</strong>
                        <br />
                        Station timestamps samples using GPS;
                        <br /> Timestamps are extremely accurate
                      </span>
                    </div>
                    <div className={styles.tooltipItem}>
                      <span>
                        <strong>Unsynced</strong>
                        <br />
                        Station timestamps samples using internal clock;
                        <br /> Timestamps are less accurate
                        <br />
                        <br />
                        <em>
                          Data across all GPS-synced stations can be
                          <br /> used to accurately calculate the parameters of
                          an
                          <br /> earthuake and compared weith other networks
                        </em>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          <div className={styles.tooltipWrapper}>
            <img
              src={"./questionmark.svg"}
              alt="Questionmark"
              className={styles.questionmarkIcon}
            />
            <div className={styles.tooltip}>
              <div className={styles.tooltipItem}>
                <span>
                  <strong>30s @ 250Hz</strong>
                  <br />
                  Short Duration
                  <br /> High resolution
                </span>
              </div>
              <div className={styles.tooltipItem}>
                <span>
                  <strong>5m @ 50Hz</strong>
                  <br />
                  Extended duration
                  <br /> Medium resolution
                  <br />
                  <br />
                  <em>
                    <strong>Spikes:</strong> Always 250Hz
                  </em>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {buffer && buffer.length == 0 && (
        <div className={styles.bufferEmpty}>
          Data will be displayed here when available...
        </div>
      )}
      {buffer && buffer.length > 0 && (
        <>
          <div className={styles.inlineLabel}>
            <span className={styles.title}>Amplitude Plot</span>

            <div className={styles.tooltipWrapper}>
              <img
                src={"./questionmark.svg"}
                alt="Questionmark"
                className={styles.questionmarkIcon}
              />
              <div className={styles.tooltip}>
                <div className={styles.tooltipItem}>
                  <em>
                    Look for sudden spikes in the graph
                    <br />
                    Those usually indicate an earthquake
                  </em>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.seismoPlotWrapper}>
            <SeismoPlot
              buffer={buffer}
              virtualNow={virtualNow}
              bufferSizeSec={bufferSizeSec}
            />
          </div>
          <div className={styles.inlineLabel}>
            <span className={styles.title}>Spectrogram</span>

            <div className={styles.tooltipWrapper}>
              <img
                src={"./questionmark.svg"}
                alt="Questionmark"
                className={styles.questionmarkIcon}
              />
              <div className={styles.tooltip}>
                <div className={styles.tooltipItem}>
                  <em>
                    Brighter red bands show stronger vibrations
                    <br />
                    at specific frequencies and times
                    <br />
                    Blue areas mean little or no activity
                  </em>
                </div>
              </div>
            </div>
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
