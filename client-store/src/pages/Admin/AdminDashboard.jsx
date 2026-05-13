import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../../api/products';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    featured: 0,
  });

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 1 }),
      getCategories(),
      getProducts({ featured: true, limit: 1 }),
    ]).then(([p, c, f]) => {
      setStats({
        products: p.data.total,
        categories: c.data.filter((x) => x.count > 0).length,
        featured: f.data.total,
      });
    });
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  return (
    <div className={styles.page}>
      <aside className={styles.side}>
        <nav className={styles.nav}>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/products/new">Add Product</Link>
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <button type="button" className={styles.logout} onClick={logout}>
            Logout
          </button>
        </header>
        <div className={styles.cards}>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Active products</p>
            <p className={styles.cardVal}>{stats.products}</p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Categories in use</p>
            <p className={styles.cardVal}>{stats.categories}</p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Featured</p>
            <p className={styles.cardVal}>{stats.featured}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
