import styles from "./page.module.css";

export function Map() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notFound}>
        <h1>Coming soon...</h1>
        <p>
          We're currently working on this feature and it will be available soon...
        </p>
        <a href="/" className={styles.link}>
          ⬅ Back to Home
        </a>
      </div>
    </div>
  );
}

export default Map;