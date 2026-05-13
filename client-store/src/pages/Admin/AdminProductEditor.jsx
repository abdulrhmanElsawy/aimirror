import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  updateProduct,
  getProductAdmin,
} from '../../api/products';
import { PRODUCT_CATEGORIES, SIZE_OPTIONS } from '../../constants/categories';
import styles from './AdminProductEditor.module.css';

const emptyColor = { name: '', hex: '#1D3FA6', file: null, path: '' };

export default function AdminProductEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('jacket');
  const [gender, setGender] = useState('unisex');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [colors, setColors] = useState([{ ...emptyColor }]);
  const [sizeState, setSizeState] = useState(
    () =>
      Object.fromEntries(SIZE_OPTIONS.map((s) => [s, { checked: false, stock: 0 }]))
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getProductAdmin(id)
      .then((res) => {
        const p = res.data;
        setName(p.name);
        setCategory(p.category);
        setGender(p.gender);
        setDescription(p.description || '');
        setPrice(String(p.price));
        setCurrency(p.currency);
        setIsFeatured(p.isFeatured);
        setTagsInput((p.tags || []).join(', '));
        setColors(
          (p.images || []).map((im) => ({
            name: im.color,
            hex: im.hex,
            file: null,
            path: im.imagePath,
          }))
        );
        const next = { ...sizeState };
        (p.sizes || []).forEach((s) => {
          if (next[s.size] != null) {
            next[s.size] = { checked: true, stock: s.stock };
          }
        });
        setSizeState(next);
      })
      .catch(() => setError('Failed to load product'));
  }, [id, isEdit]);

  const addColor = () => setColors((c) => [...c, { ...emptyColor }]);

  const updateColor = (i, field, value) => {
    setColors((prev) => {
      const n = [...prev];
      n[i] = { ...n[i], [field]: value };
      return n;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const sizes = SIZE_OPTIONS.filter((s) => sizeState[s].checked).map((s) => ({
      size: s,
      stock: Number(sizeState[s].stock) || 0,
    }));
    if (!name || !price) {
      setError('Name and price are required');
      return;
    }
    if (colors.some((c) => !c.name)) {
      setError('Each color needs a name');
      return;
    }
    if (!isEdit) {
      if (colors.some((c) => !c.file)) {
        setError('Upload an image for each color');
        return;
      }
    }

    const imagesMeta = colors.map((c) => ({
      color: c.name,
      hex: c.hex,
      imagePath: c.path || '',
    }));

    const fd = new FormData();
    if (!isEdit) {
      fd.append(
        'data',
        JSON.stringify({
          name,
          category,
          gender,
          description,
          price: Number(price),
          currency,
          isFeatured,
          tags,
          sizes,
          images: imagesMeta.map(({ color, hex }) => ({ color, hex })),
        })
      );
      colors.forEach((c) => fd.append('images', c.file));
      await createProduct(fd);
    } else {
      const replaceIndices = [];
      const files = [];
      colors.forEach((c, idx) => {
        if (c.file) {
          replaceIndices.push(idx);
          files.push(c.file);
        }
      });
      fd.append(
        'data',
        JSON.stringify({
          name,
          category,
          gender,
          description,
          price: Number(price),
          currency,
          isFeatured,
          tags,
          sizes,
          images: imagesMeta,
          replaceIndices,
        })
      );
      files.forEach((f) => fd.append('images', f));
      await updateProduct(id, fd);
    }
    nav('/admin/products');
  };

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
          <h1>{isEdit ? 'Edit product' : 'New product'}</h1>
          <button type="button" className={styles.logout} onClick={logout}>
            Logout
          </button>
        </header>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field}>
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <fieldset className={styles.field}>
            <legend>Gender</legend>
            {['men', 'women', 'unisex'].map((g) => (
              <label key={g} className={styles.inline}>
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={gender === g}
                  onChange={() => setGender(g)}
                />
                {g}
              </label>
            ))}
          </fieldset>
          <label className={styles.field}>
            Description
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              Price
              <input
                required
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              Currency
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </label>
          </div>
          <label className={styles.inline}>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Featured
          </label>

          <h2 className={styles.h2}>Colors</h2>
          {colors.map((c, i) => (
            <div key={i} className={styles.colorRow}>
              <input
                placeholder="Color name"
                value={c.name}
                onChange={(e) => updateColor(i, 'name', e.target.value)}
              />
              <input
                type="color"
                value={c.hex}
                onChange={(e) => updateColor(i, 'hex', e.target.value)}
                aria-label="Hex"
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  updateColor(i, 'file', e.target.files?.[0] || null)
                }
              />
              {isEdit && c.path && (
                <span className={styles.hint}>Current: {c.path}</span>
              )}
            </div>
          ))}
          <button type="button" className={styles.secondary} onClick={addColor}>
            Add color
          </button>

          <h2 className={styles.h2}>Sizes</h2>
          <div className={styles.sizes}>
            {SIZE_OPTIONS.map((s) => (
              <div key={s} className={styles.sizeRow}>
                <label className={styles.inline}>
                  <input
                    type="checkbox"
                    checked={sizeState[s].checked}
                    onChange={(e) =>
                      setSizeState((prev) => ({
                        ...prev,
                        [s]: { ...prev[s], checked: e.target.checked },
                      }))
                    }
                  />
                  {s}
                </label>
                {sizeState[s].checked && (
                  <input
                    type="number"
                    min={0}
                    placeholder="Stock"
                    value={sizeState[s].stock}
                    onChange={(e) =>
                      setSizeState((prev) => ({
                        ...prev,
                        [s]: {
                          ...prev[s],
                          stock: Number(e.target.value),
                        },
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <label className={styles.field}>
            Tags (comma-separated)
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </label>

          {error && (
            <p className={styles.err} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={styles.submit}>
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
