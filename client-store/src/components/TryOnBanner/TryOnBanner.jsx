import styles from './TryOnBanner.module.css';

const tryonUrl = import.meta.env.VITE_TRYON_TOOL_URL || 'http://localhost:5174';

export default function TryOnBanner() {
  return (
    <section className={styles.banner}>
      <div className={styles.inner}>
        <p className={styles.text}>
          Try Before You Buy — AI Virtual Try-On
        </p>
        <a
          href={tryonUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.btn}
        >
          Launch Try-On Tool
        </a>
      </div>
    </section>
  );
}
