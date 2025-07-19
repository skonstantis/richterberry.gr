import styles from "./page.module.css";

export function PageUnableToConnect() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notFound}>
        <h1>Unable to Connect</h1>
        <p>We could not establish a connection to the server.</p>
        <p>Please check your internet connection and refresh the page when online again.</p>
        <p>If the problem persists, this could be our fault. Try again in a few minutes.</p>
      </div>
    </div>
  );
}
