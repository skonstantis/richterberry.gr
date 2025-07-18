import { Link } from "react-router-dom";
import styles from "./header.module.css";
import { useWebSocket } from "./WebSocketProvider";

function Header() {
  const { stations } = useWebSocket();

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
          {stations != null && stations.map(({ name, id, location, connected }) => (
              <Link
                key={id}
                to={`/${name.toLowerCase()}`}
                className={styles.dropdownItem}
              >
                <div className={styles.stationInfo}>
                  <div>
                    <div className={styles.stationName}>{name.toUpperCase()}</div>
                    <div className={styles.stationLocation}>{location.toUpperCase()}</div>
                  </div>
                  <span
                    className={styles.statusDot}
                    style={{
                      backgroundColor: connected ? "#7bb661" : "#b04a4a",
                    }}
                  ></span>
                </div>
              </Link>
            ))}
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
