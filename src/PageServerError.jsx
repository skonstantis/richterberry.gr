import styles from "./page.module.css";

export function PageServerError() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notFound}>
        <h1>500 — Server Error</h1>
        <p>The server did not provide the required station data.</p>
        <p>Please try refreshing or contact support if the issue persists.</p>
      </div>
    </div>
  );
}
