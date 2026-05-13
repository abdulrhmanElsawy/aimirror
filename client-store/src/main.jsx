import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './styles/global.module.css';
import App from './App.jsx';

void styles;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
