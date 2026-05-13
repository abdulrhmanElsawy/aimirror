import { useState } from 'react';
import styles from './AutoPickScreen.module.css';

const EVENTS = [
  { id: 'casual', label: 'Casual day', icon: '◇' },
  { id: 'wedding', label: 'Wedding', icon: '✦' },
  { id: 'office', label: 'Office', icon: '▢' },
  { id: 'party', label: 'Party', icon: '◆' },
  { id: 'formal', label: 'Formal', icon: '◇' },
];

export default function AutoPickScreen({ onBack, onNext }) {
  const [sel, setSel] = useState('casual');

  return (
    <div className={`pageEnter ${styles.root}`}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back">
          ←
        </button>
        <h1 className={styles.title}>What&apos;s the occasion?</h1>
      </header>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {EVENTS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`${styles.card} ${sel === e.id ? styles.on : ''}`}
              onClick={() => setSel(e.id)}
            >
              <span className={styles.icon} aria-hidden>
                {e.icon}
              </span>
              <span className={styles.label}>{e.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <button type="button" className="btnPrimary btnBlock" onClick={() => onNext(sel)}>
          Next: take photo
        </button>
      </div>
    </div>
  );
}
