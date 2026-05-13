import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProductsAdmin,
  toggleFeatured,
  deactivateProduct,
  reactivateProduct,
} from '../../api/products';
import { imageUrl } from '../../utils/imageUrl';
import styles from './AdminProductsPage.module.css';

export default function AdminProductsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ products: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getProductsAdmin({ page, limit: 20, search: q || undefined })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  const logout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const confirmDeactivate = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await deactivateProduct(id);
    load();
  };

  const handleFeatured = async (id) => {
    await toggleFeatured(id);
    load();
  };

  const handleActive = async (p) => {
    if (p.isActive) await deactivateProduct(p._id);
    else await reactivateProduct(p._id);
    load();
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
          <h1>Products</h1>
          <button type="button" className={styles.logout} onClick={logout}>
            Logout
          </button>
        </header>
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="Search by name"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <Link to="/admin/products/new" className={styles.add}>
            Add product
          </Link>
        </div>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Sizes</th>
                  <th>Featured</th>
                  <th>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <img
                        className={styles.thumb}
                        src={imageUrl(p.images?.[0]?.imagePath)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>
                      {p.price} {p.currency}
                    </td>
                    <td>
                      {(p.sizes || []).map((s) => s.size).join(', ')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleFeatured(p._id)}
                        aria-pressed={p.isFeatured}
                      >
                        {p.isFeatured ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleActive(p)}
                        aria-pressed={p.isActive}
                      >
                        {p.isActive ? 'Active' : 'Off'}
                      </button>
                    </td>
                    <td>
                      <Link to={`/admin/products/${p._id}/edit`}>Edit</Link>
                      <button
                        type="button"
                        className={styles.danger}
                        onClick={() => confirmDeactivate(p._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.pager}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>
                Page {page} / {data.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
