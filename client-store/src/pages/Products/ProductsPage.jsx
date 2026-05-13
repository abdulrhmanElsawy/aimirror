import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../../api/products';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import FilterSidebar from '../../components/FilterSidebar/FilterSidebar';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import styles from './ProductsPage.module.css';

function parseFilters(searchParams) {
  const categories = (searchParams.get('categories') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    categories,
    gender: searchParams.get('gender') || '',
    minPrice: searchParams.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : undefined,
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
  };
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => parseFilters(searchParams));
  const [drawer, setDrawer] = useState(false);
  const [data, setData] = useState({ products: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters(parseFilters(searchParams));
  }, [searchParams]);

  const load = useCallback(() => {
    setLoading(true);
    const f = parseFilters(searchParams);
    const params = {
      page: f.page,
      limit: 12,
    };
    if (f.categories.length) params.categories = f.categories.join(',');
    if (f.gender) params.gender = f.gender;
    if (f.minPrice != null) params.minPrice = f.minPrice;
    if (f.maxPrice != null) params.maxPrice = f.maxPrice;

    getProducts(params)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  const commitFilters = (next) => {
    const p = new URLSearchParams();
    if (next.categories?.length) {
      p.set('categories', next.categories.join(','));
    }
    if (next.gender) p.set('gender', next.gender);
    if (next.minPrice != null) p.set('minPrice', String(next.minPrice));
    if (next.maxPrice != null) p.set('maxPrice', String(next.maxPrice));
    p.set('page', '1');
    setSearchParams(p);
  };

  const setPage = (pg) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', String(pg));
    setSearchParams(p);
  };

  const f = parseFilters(searchParams);

  return (
    <>
      <Navbar />
      <main className={`mainWithNav pageEnter ${styles.layout}`}>
        <button
          type="button"
          className={styles.filterFab}
          aria-label="Open filters"
          onClick={() => setDrawer(true)}
        >
          Filters
        </button>
        <FilterSidebar
          filters={filters}
          onChange={commitFilters}
          mobileOpen={drawer}
          onClose={() => setDrawer(false)}
        />
        <div className={styles.main}>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <ProductGrid products={data.products} />
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={f.page <= 1}
                  onClick={() => setPage(f.page - 1)}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {f.page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={f.page >= data.totalPages}
                  onClick={() => setPage(f.page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
