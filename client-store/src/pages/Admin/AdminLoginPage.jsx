import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import styles from './AdminLoginPage.module.css';

export default function AdminLoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('adminToken')) nav('/admin', { replace: true });
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await login(username, password);
      localStorage.setItem('adminToken', data.token);
      nav('/admin');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={submit}>
        <h1 className={styles.title}>Admin login</h1>
        <label className={styles.label}>
          Username
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className={styles.err} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={styles.btn}>
          Login
        </button>
      </form>
    </div>
  );
}
