import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { imageUrl } from '../../utils/imageUrl';
import styles from './ProductPickerScreen.module.css';

export default function ProductPickerScreen({ onBack, onNext, category: initialCat }) {
  const [category, setCategory] = useState(initialCat || '');
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { limit: 48 };
    if (category) params.categories = category;
    api
      .get('/api/products', { params })
      .then((res) => setProducts(res.data.products))
      .finally(() => setLoading(false));
  }, [category]);

  const cats = [
    'jacket',
    'tshirt',
    'trousers',
    'dress',
    'shirt',
    'jeans',
    'suit',
    'hoodie',
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className={`pageEnter ${styles.root}`}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back">
          ←
        </button>
        <h1 className={styles.title}>Choose a piece</h1>
      </header>
      <div className={styles.searchRow}>
        <label className={styles.searchLabel} htmlFor="tryon-search">
          Search
        </label>
        <input
          id="tryon-search"
          type="search"
          className={styles.search}
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className={styles.filters}>
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={`${styles.cat} ${category === c ? styles.catOn : ''}`}
            onClick={() => setCategory(category === c ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>
      {loading ? (
        <p className={styles.loading}>Loading…</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <button
              type="button"
              key={p._id}
              className={`${styles.card} ${selected?._id === p._id ? styles.cardSel : ''}`}
              onClick={() => setSelected(p)}
            >
              <div className={styles.imgWrap}>
                {p.images?.[0] && (
                  <img
                    src={imageUrl(p.images[0].imagePath)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {selected?._id === p._id && <span className={styles.check}>✓</span>}
              </div>
              <span className={styles.name}>{p.name}</span>
              <span className={styles.price}>
                {p.price} {p.currency}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <button
          type="button"
          className="btnPrimary btnBlock"
          disabled={!selected}
          onClick={() => onNext(selected)}
        >
          Next: take photo
        </button>
      </div>
    </div>
  );
}
