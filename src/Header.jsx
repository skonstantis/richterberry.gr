import { Link } from "react-router-dom";
import styles from "./header.module.css";
import { useWebSocket } from "./WebSocketProvider";
import { getJetColor } from "./getJetColor";

function Header() {
  const { stationsMax, stations } = useWebSocket();
  return (
    <div>
      <div className={styles.wrapper}>
        <Link to="/">
          <img src="./logo.svg" alt="Logo" className={styles.logo} />
        </Link>
      </div>
      <div className={styles.wrapperNav}>
        <div className={styles.dropdown}>
          <div className={styles.link}>
            STATIONS
            <span className={styles.downArrow}></span>
          </div>
          <div className={styles.dropdownContent}>
            {stations != null &&
              stations.map(({ name, id, location, connected }) => {
                const maxValue = stationsMax?.[name.toLowerCase()];
                const showColor = connected && maxValue != null;
                const swatchColor = showColor
                  ? getJetColor(maxValue, 0, 1000)
                  : "transparent";

                return (
                  <Link
                    key={id}
                    to={`/${name.toLowerCase()}`}
                    className={styles.dropdownItem}
                  >
                    <div className={styles.stationInfo}>
                      <div
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          borderRadius: "2px",
                          marginRight: "8px",
                          backgroundColor: swatchColor,
                          border: "1px solid #888",
                          flexShrink: 0,
                        }}
                      ></div>

                      <div>
                        <div className={styles.stationName}>
                          {name.toUpperCase()}
                        </div>
                        <div className={styles.stationLocation}>
                          {location.toUpperCase()}
                        </div>
                      </div>

                      <span
                        className={styles.statusDot}
                        style={{
                          backgroundColor: connected ? "#7bb661" : "#b04a4a",
                        }}
                      ></span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
        <a href="/how-it-works" className={styles.link}>
          HOW IT WORKS
          <span className={styles.questionmark}></span>
        </a>
      </div>
    </div>
  );
}

export default Header;
