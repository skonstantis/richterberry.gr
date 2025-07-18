import { Link } from "react-router-dom";
import styles from "./header.module.css";

function Header() {
  return (
    <div>
      <div className={styles.wrapper}>
        <Link to="/">
          <img src="./logo.svg" alt="Logo" className={styles.logo} />
        </Link>
      </div>
      <div className={styles.wrapperNav}>
        <a href="/how-it-works" className={styles.link}>
          HOW IT WORKS
          <span className={styles.questionmark}></span>
        </a>
      </div>
    </div>
  );
}

export default Header;
