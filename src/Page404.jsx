import styles from "./page.module.css";

export function Page404() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notFound}>
        <h1>404 — Page Not Found</h1>
        <p>
          Oops! The path{" "}
          <code>{window.location.pathname.replace("/", "")}</code> does not
          exist.
        </p>
        <p>
          Please check the URL for typos, or return to a valid page.
        </p>
        <a href="/" className={styles.link}>
          ⬅ Back to Home
        </a>
      </div>
    </div>
  );
}
