import styles from "./header.module.css";
import logo from "/logo.svg";

function Header() {
    return (
      <div className={styles.wrapper}>
        <img src={logo} alt="Logo" className={styles.logo} />
      </div>
    );
  }  

export default Header;