import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLoading } from "./PageLoading";
import { PageError } from "./PageError";
import { PageUnableToConnect } from "./PageUnableToConnect";
import styles from "./panel.module.css";
import { useWebSocket } from "./WebSocketProvider";
import { getJetColor } from "./getJetColor";

export function Panel() {
  const { stations, stationsMax, connected, isConnecting } = useWebSocket();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (stations || !isConnecting) {
      setTimedOut(false);
      return;
    }
    const timeoutId = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(timeoutId);
  }, [isConnecting, stations]);

  if (timedOut) return <PageError />;
  if (isConnecting || !stations || !stationsMax) return <PageLoading />;
  if (!connected && !isConnecting) return <PageUnableToConnect />;
  if (stations.length === 0) return <PageError />;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.panelTable}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Station</th>
            <th>Location</th>
            <th>Mode</th>
          </tr>
        </thead>
        <tbody>
          {[...stations]
            .sort((a, b) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1))
            .map((station) => {
              const modeClass = {
                Testing: styles.modeTesting,
                Deployed: styles.modeDeployed,
                Maintenance: styles.modeMaintenance,
              }[station.mode] || "";

              const maxValue = stationsMax[station.name.toLowerCase()];
              const showColor = maxValue !== 0 && maxValue != null;
              const swatchColor = station.connected
                ? showColor
                  ? getJetColor(maxValue, 0, 1000)
                  : "transparent"
                : "transparent"; 

              return (
                <tr
                  key={station.id}
                  className={styles.stationRow}
                  style={{ backgroundColor: swatchColor }}
                  onClick={() => navigate(`/${station.name.toLowerCase()}`)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/${station.name.toLowerCase()}`);
                    }
                  }}
                >
                  <td>
                    <span
                      className={styles.statusDot}
                      style={{
                        backgroundColor: station.connected ? "#7bb661" : "#b04a4a",
                      }}
                      title={station.connected ? "Online" : "Offline"}
                    />
                  </td>
                  <td className={styles.stationName}>{station.name.toUpperCase()}</td>
                  <td>
                    <span className={styles.location}>
                      <img
                        src="./location-icon.svg"
                        alt="Location"
                        className={styles.locationIcon}
                      />
                      {station.location}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.modeWrapper} ${modeClass}`}>
                      <img src="./mode-icon.svg" alt="Mode" className={styles.modeIcon} />
                      {station.mode}
                    </span>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default Panel;
