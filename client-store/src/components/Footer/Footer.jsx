import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function IconIg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-3a8 8 0 018 8 8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8zm9.5-.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function IconFb() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 10h2.5l.5-3H13V5.5c0-.9.3-1.5 1.6-1.5H16V1.1A22 22 0 0013.6 1C11 1 9.5 2.5 9.5 5.2V7H7v3h2.5v7H13v-7z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');

  const submit = (e) => {
    e.preventDefault();
  };

  return (
    <footer className={styles.root}>
      <div className={styles.grid}>
        <div className={styles.col}>
          <p className={styles.brand}>AIMirror</p>
          <p className={styles.desc}>
            Editorial fashion with a calm digital experience. Preview looks on you before you buy.
          </p>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Shop</p>
          <Link to="/products" className={styles.link}>
            All products
          </Link>
          <Link to="/" className={styles.link}>
            Home
          </Link>
          <Link to="/products?gender=women" className={styles.link}>
            Women
          </Link>
          <Link to="/products?gender=men" className={styles.link}>
            Men
          </Link>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Info</p>
          <span className={styles.linkMuted}>Shipping</span>
          <span className={styles.linkMuted}>Returns</span>
          <span className={styles.linkMuted}>Contact</span>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Newsletter</p>
          <p className={styles.newsHint}>New arrivals and private edits.</p>
          <form className={styles.newsForm} onSubmit={submit}>
            <input
              type="email"
              className={styles.newsInput}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email for newsletter"
            />
            <button type="submit" className={styles.newsBtn}>
              Join
            </button>
          </form>
          <div className={styles.social}>
            <button type="button" className={styles.socialLink} aria-label="Instagram (coming soon)">
              <IconIg />
            </button>
            <button type="button" className={styles.socialLink} aria-label="Facebook (coming soon)">
              <IconFb />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p className={styles.copy}>&copy; {new Date().getFullYear()} AIMirror. All rights reserved.</p>
        <div className={styles.payments} aria-hidden>
          <span className={styles.payBadge}>Visa</span>
          <span className={styles.payBadge}>MC</span>
          <span className={styles.payBadge}>Amex</span>
        </div>
      </div>
    </footer>
  );
}
