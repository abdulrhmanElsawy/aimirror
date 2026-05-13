import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../../api/products';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import SizeTag from '../../components/SizeTag/SizeTag';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { imageUrl } from '../../utils/imageUrl';
import styles from './ProductDetailPage.module.css';

const tryonBase = import.meta.env.VITE_TRYON_TOOL_URL || 'http://localhost:5174';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorIdx, setColorIdx] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => setErr('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="mainWithNav">
          <LoadingSpinner />
        </div>
        <Footer />
      </>
    );
  }

  if (err || !product) {
    return (
      <>
        <Navbar />
        <p className={`mainWithNav pageEnter ${styles.err}`} role="alert">
          {err || 'Not found'}
        </p>
        <Footer />
      </>
    );
  }

  const variant = product.images[colorIdx] || product.images[0];
  const tryonHref = `${tryonBase}?productId=${product._id}`;

  return (
    <>
      <Navbar />
      <main className={`mainWithNav pageEnter ${styles.wrap}`}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden> / </span>
          <Link to="/products">Products</Link>
          <span aria-hidden> / </span>
          <span>{product.name}</span>
        </nav>
        <div className={styles.grid}>
          <div>
            <div className={styles.mainImg}>
              {variant && (
                <img
                  src={imageUrl(variant.imagePath)}
                  alt={product.name}
                  className={styles.heroImg}
                  loading="eager"
                  decoding="async"
                />
              )}
            </div>
            <div className={styles.thumbs}>
              {(product.images || []).map((v, i) => (
                <button
                  type="button"
                  key={`${v.color}-${i}`}
                  className={`${styles.thumb} ${i === colorIdx ? styles.thumbActive : ''}`}
                  onClick={() => setColorIdx(i)}
                  aria-label={`Color ${v.color}`}
                >
                  <img src={imageUrl(v.imagePath)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>
          <div className={styles.stickyCol}>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.price}>
              {product.price} {product.currency}
            </p>
            <div className={styles.badges}>
              <span className={styles.badge}>{product.category}</span>
              <span className={styles.badge}>{product.gender}</span>
            </div>
            <p className={styles.label}>Color</p>
            <div className={styles.swatches}>
              {(product.images || []).map((v, i) => (
                <button
                  type="button"
                  key={`sw-${v.color}-${i}`}
                  className={styles.swatchBtn}
                  data-active={i === colorIdx}
                  onClick={() => setColorIdx(i)}
                  aria-label={v.color}
                >
                  <span className={styles.swatch} style={{ background: v.hex }} />
                </button>
              ))}
            </div>
            <p className={styles.label}>Sizes</p>
            <div className={styles.sizes}>
              {(product.sizes || []).map((s) => (
                <SizeTag key={s.size} size={s.size} stock={s.stock} />
              ))}
            </div>
            <p className={styles.desc}>{product.description}</p>
            <div className={styles.tags}>
              {(product.tags || []).map((t) => (
                <span key={t} className={styles.tagPill}>
                  {t}
                </span>
              ))}
            </div>
            <button type="button" className={`btnPrimary btnBlock ${styles.ctaGap}`}>
              Add to cart
            </button>
            <a
              href={tryonHref}
              target="_blank"
              rel="noreferrer"
              className={`btnGhost btnBlock ${styles.tryon}`}
            >
              Try on with AI
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
