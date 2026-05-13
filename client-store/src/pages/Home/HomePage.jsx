import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../../api/products';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import TryOnBanner from '../../components/TryOnBanner/TryOnBanner';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { imageUrl } from '../../utils/imageUrl';
import styles from './HomePage.module.css';

export default function HomePage() {
  const nav = useNavigate();
  const featuredRef = useRef(null);
  const [featured, setFeatured] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProducts({ featured: true, limit: 8 }),
      getCategories(),
    ])
      .then(([fp, cr]) => {
        setFeatured(fp.data.products);
        setCats(cr.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const heroImage =
    featured[0]?.images?.[0]?.imagePath != null
      ? imageUrl(featured[0].images[0].imagePath)
      : null;

  const categoryTiles = cats.filter((c) => c.count > 0).slice(0, 4);

  return (
    <>
      <Navbar />
      <main className={`pageEnter ${styles.main}`}>
        <section
          className={styles.hero}
          style={
            heroImage
              ? { backgroundImage: `linear-gradient(to top, rgba(26,26,24,0.65) 0%, rgba(26,26,24,0.25) 45%, rgba(26,26,24,0.35) 100%), url(${heroImage})` }
              : undefined
          }
        >
          <div className={styles.heroInner}>
            <h1 className={styles.display}>Quiet luxury, made for you</h1>
            <p className={styles.sub}>
              Curated pieces &mdash; preview every look with AI try-on before you decide.
            </p>
            <button
              type="button"
              className={styles.heroCta}
              onClick={() =>
                featuredRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Browse collection
            </button>
          </div>
        </section>

        <section className={styles.trustBar} aria-label="Service highlights">
          <div className={styles.trustInner}>
            <span>Complimentary delivery over threshold</span>
            <span>30-day returns</span>
            <span>Secure checkout</span>
            <span>Virtual try-on</span>
          </div>
        </section>

        {categoryTiles.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Shop by category</h2>
              <Link to="/products" className={styles.sectionLink}>
                View all
              </Link>
            </div>
            <div className={styles.catGrid}>
              {categoryTiles.map((c) => (
                <button
                  type="button"
                  key={c.category}
                  className={styles.catTile}
                  onClick={() =>
                    nav(`/products?categories=${encodeURIComponent(c.category)}`)
                  }
                >
                  <span className={styles.catTileBg} />
                  <span className={styles.catTileContent}>
                    <span className={styles.catName}>{c.category}</span>
                    <span className={styles.catShop}>Shop now &rarr;</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section ref={featuredRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured</h2>
            <Link to="/products" className={styles.sectionLink}>
              See all products
            </Link>
          </div>
          {loading ? <LoadingSpinner /> : <ProductGrid products={featured} />}
        </section>

        <section className={styles.editorial}>
          <div className={styles.editorialGrid}>
            <div className={styles.editorialVisual}>
              {featured[1]?.images?.[0] && (
                <img
                  src={imageUrl(featured[1].images[0].imagePath)}
                  alt=""
                  className={styles.editorialImg}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <div className={styles.editorialCopy}>
              <p className={styles.editorialLabel}>New collection</p>
              <h2 className={styles.editorialTitle}>Form and fabric</h2>
              <p className={styles.editorialBody}>
                Thoughtful silhouettes and tactile materials for everyday refinement.
                Discover the edit online or see it on you with our try-on studio.
              </p>
              <Link to="/products" className={`btnGhost ${styles.editorialBtn}`}>
                Explore the edit
              </Link>
            </div>
          </div>
        </section>

        <TryOnBanner />
      </main>
      <Footer />
    </>
  );
}
