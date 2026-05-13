import { useEffect, useState } from 'react';
import { getCategories } from '../../api/products';
import styles from './FilterSidebar.module.css';

const GENDERS = [
  { value: '', label: 'All' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' },
];

export default function FilterSidebar({ filters, onChange, mobileOpen, onClose }) {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    getCategories()
      .then((res) => setCats(res.data))
      .catch(() => setCats([]));
  }, []);

  const toggleCategory = (category) => {
    const set = new Set(filters.categories || []);
    if (set.has(category)) set.delete(category);
    else set.add(category);
    onChange({ ...filters, categories: [...set] });
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <h2 className={styles.heading}>Filters</h2>

        <section className={styles.section}>
          <h3 className={styles.sub}>Category</h3>
          {cats.map((c) => (
            <label key={c.category} className={styles.row}>
              <input
                type="checkbox"
                checked={(filters.categories || []).includes(c.category)}
                onChange={() => toggleCategory(c.category)}
              />
              <span>
                {c.category} ({c.count})
              </span>
            </label>
          ))}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sub}>Gender</h3>
          <div className={styles.radios}>
            {GENDERS.map((g) => (
              <label key={g.value || 'all'} className={styles.row}>
                <input
                  type="radio"
                  name="gender"
                  checked={filters.gender === g.value}
                  onChange={() => onChange({ ...filters, gender: g.value })}
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sub}>Price (EGP)</h3>
          <div className={styles.priceRow}>
            <label className={styles.priceLabel}>
              Min
              <input
                type="number"
                min={0}
                className={styles.input}
                value={filters.minPrice ?? ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    minPrice: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className={styles.priceLabel}>
              Max
              <input
                type="number"
                min={0}
                className={styles.input}
                value={filters.maxPrice ?? ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    maxPrice: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        </section>

        <button
          type="button"
          className={styles.reset}
          onClick={() =>
            onChange({
              categories: [],
              gender: '',
              minPrice: undefined,
              maxPrice: undefined,
            })
          }
        >
          Reset Filters
        </button>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close filters"
          onClick={onClose}
        />
      )}
    </>
  );
}
