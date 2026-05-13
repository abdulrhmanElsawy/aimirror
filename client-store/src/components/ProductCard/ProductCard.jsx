import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../../utils/imageUrl';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const nav = useNavigate();
  const img = product.images?.[0];

  const go = () => nav(`/products/${product._id}`);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {img && (
          <img
            src={imageUrl(img.imagePath)}
            alt={product.name}
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
        )}
        <button type="button" className={styles.quickView} onClick={go}>
          Quick view
        </button>
      </div>
      <button type="button" className={styles.bodyBtn} onClick={go}>
        <span className={styles.meta}>{product.category}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>
          {product.price} {product.currency}
        </p>
        {(product.images || []).length > 1 && (
          <div className={styles.swatches} aria-hidden>
            {(product.images || []).map((v) => (
              <span
                key={`${v.color}-${v.hex}`}
                className={styles.swatch}
                style={{ background: v.hex }}
                title={v.color}
              />
            ))}
          </div>
        )}
      </button>
    </article>
  );
}
