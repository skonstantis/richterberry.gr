import styles from "./page.module.css";

export function PageLoading() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notFound}>
        <h1>Loading…</h1>
        <p>Please wait while we load the content.</p>
      </div>
    </div>
  );
}
