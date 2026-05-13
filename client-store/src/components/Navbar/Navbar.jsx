import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const tryonUrl = import.meta.env.VITE_TRYON_TOOL_URL || 'http://localhost:5174';

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 21s-7-4.35-7-10a5 5 0 0110 0c0 5.65-7 10-7 10z" strokeLinejoin="round" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 7h12l-1 12H7L6 7z" strokeLinejoin="round" />
      <path d="M9 7V5a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroMode = isHome && !scrolled;

  return (
    <header
      className={`${styles.bar} ${heroMode ? styles.barHero : ''} ${scrolled ? styles.barScrolled : ''}`}
    >
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          AIMirror
        </Link>
        <button
          type="button"
          className={styles.burger}
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`}>
          <NavLink to="/" className={styles.link} end onClick={() => setOpen(false)}>
            <span className={styles.linkText}>Home</span>
          </NavLink>
          <NavLink to="/products" className={styles.link} onClick={() => setOpen(false)}>
            <span className={styles.linkText}>Shop</span>
          </NavLink>
          <NavLink to="/products" className={styles.link} onClick={() => setOpen(false)}>
            <span className={styles.linkText}>Collections</span>
          </NavLink>
        </nav>
        <div className={styles.right}>
          <div className={styles.icons}>
            <Link to="/products" className={styles.iconBtn} aria-label="Search">
              <IconSearch />
            </Link>
            <span className={styles.iconBtn} aria-hidden title="Wishlist">
              <IconHeart />
            </span>
            <span className={styles.iconBtn} aria-hidden title="Cart">
              <IconBag />
            </span>
          </div>
          <a href={tryonUrl} target="_blank" rel="noreferrer" className={styles.cta}>
            Try On
          </a>
        </div>
      </div>
    </header>
  );
}
