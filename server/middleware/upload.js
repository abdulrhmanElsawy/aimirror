const path = require('path');
const fs = require('fs');
const multer = require('multer');

const productDir = path.join(__dirname, '..', 'uploads', 'products');
const sessionDir = path.join('uploads', 'sessions');
const sessionDirAbs = path.join(__dirname, '..', 'uploads', 'sessions');

function shouldSkipUploadDirs() {
  // Vercel sets VERCEL=1 in many builds; some runtimes only set VERCEL without strict "1"
  if (process.env.VERCEL != null && String(process.env.VERCEL).length > 0) return true;
  if (process.env.VERCEL_ENV) return true;
  return false;
}

function ensureDirs() {
  if (shouldSkipUploadDirs()) return;

  ['uploads/products', 'uploads/sessions'].forEach((dir) => {
    const full = path.join(__dirname, '..', dir);
    try {
      fs.mkdirSync(full, { recursive: true });
    } catch (err) {
      // EEXIST: already there. ENOENT/EROFS/EACCES: read-only or restricted (e.g. Vercel) — never crash startup
      if (err.code === 'EEXIST') return;
      console.warn('Skipping upload dir (non-fatal):', dir, err.code, err.message);
    }
  });
}
ensureDirs();

const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fileFilter(req, file, cb) {
  if (imageMime.has(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
}

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, base + ext);
  },
});

const sessionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, sessionDirAbs),
  filename: (req, file, cb) => {
    const sid = req._sessionIdForUpload || 'temp';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${sid}-user${ext}`);
  },
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadUserPhoto = multer({
  storage: sessionStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadProduct,
  uploadUserPhoto,
  sessionDir,
  productDir,
  ensureDirs,
};
