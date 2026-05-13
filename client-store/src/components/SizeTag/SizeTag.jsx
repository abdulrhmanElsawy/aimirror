import styles from './SizeTag.module.css';

export default function SizeTag({ size, stock }) {
  const out = stock === 0;
  return (
    <span className={`${styles.tag} ${out ? styles.out : ''}`}>{size}</span>
  );
}
