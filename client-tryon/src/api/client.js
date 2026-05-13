import axios from 'axios';

// Production on Vercel: VITE_API_URL empty → same-origin `/api`. Dev: localhost server.
const raw = import.meta.env.VITE_API_URL;
const baseURL =
  raw != null && String(raw).trim() !== ''
    ? String(raw).trim()
    : import.meta.env.DEV
      ? 'http://localhost:5000'
      : '';

const api = axios.create({ baseURL });

export default api;
export { baseURL };
