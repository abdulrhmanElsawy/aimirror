import styles from './WelcomeScreen.module.css';

export default function WelcomeScreen({ onManual, onAuto }) {
  return (
    <div className={`pageEnter ${styles.root}`}>
      <h1 className={styles.headline}>See yourself in it</h1>
      <p className={styles.sub}>AI virtual try-on &mdash; calm, precise, yours</p>
      <div className={styles.actions}>
        <button type="button" className="btnPrimary" onClick={onManual}>
          Try with product
        </button>
        <button type="button" className="btnGhost" onClick={onAuto}>
          Browse event looks
        </button>
      </div>
    </div>
  );
}
