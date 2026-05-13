const path = require('path');
const fs = require('fs');
const multer = require('multer');

const productDir = path.join(__dirname, '..', 'uploads', 'products');
const sessionDir = path.join('uploads', 'sessions');
const sessionDirAbs = path.join(__dirname, '..', 'uploads', 'sessions');

function ensureDirs() {
  // Vercel serverless filesystem is read-only — skip directory creation
  if (process.env.VERCEL === '1') return;

  ['uploads/products', 'uploads/sessions'].forEach((dir) => {
    try {
      fs.mkdirSync(path.join(__dirname, '..', dir), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.warn('Could not create upload dir:', dir, err.message);
      }
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
