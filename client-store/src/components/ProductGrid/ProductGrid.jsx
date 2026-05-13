import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products }) {
  if (!products?.length) {
    return (
      <p className={styles.empty} role="status">
        No products found
      </p>
    );
  }
  return (
    <div className={styles.grid}>
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
