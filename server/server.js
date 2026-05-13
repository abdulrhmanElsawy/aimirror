require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const tryonRoutes = require('./routes/tryon');

// Skip on Vercel — read-only filesystem (align with middleware/upload.js)
const onVercel =
  (process.env.VERCEL != null && String(process.env.VERCEL).length > 0) ||
  Boolean(process.env.VERCEL_ENV);
if (!onVercel) {
  const uploadsRoot = path.join(__dirname, 'uploads');
  ['products', 'sessions'].forEach((sub) => {
    const d = path.join(uploadsRoot, sub);
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

const app = express();

const origins = [
  process.env.CLIENT_STORE_URL,
  process.env.CLIENT_TRYON_URL,
].filter(Boolean);

app.use(
  cors({
    origin: origins.length ? origins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tryon', tryonRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const msg =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Server error'
      : err.message || 'Server error';
  res.status(status).json({ error: msg });
});

const PORT = process.env.PORT || 5000;

// Local: listen after DB connects. Vercel: no listen — api/index.js invokes this app.
const dbReady = connectDB();

if (!onVercel) {
  dbReady
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  dbReady.catch((err) => {
    console.error(err);
  });
}

module.exports = app;
