import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner() {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} aria-label="Loading" role="status" />
    </div>
  );
}
