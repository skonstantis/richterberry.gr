import styles from "./page.module.css";

export function PageError() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notFound}>
        <h1>Error</h1>
        <p>Something went wrong.</p>
        <p>Please try refreshing or tray again later if the issue persists.</p>
      </div>
    </div>
  );
}
