import styles from "./body.module.css";

function Body({ children }) {
    return (
      <div className={styles.wrapper}>
        {children}
      </div>
    );
  }  

export default Body;