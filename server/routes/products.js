const express = require('express');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { CATEGORY_ENUM } = require('../models/Product');
const auth = require('../middleware/auth');
const { uploadProduct } = require('../middleware/upload');

const router = express.Router();

const uploadFields = uploadProduct.fields([{ name: 'images', maxCount: 30 }]);

router.get('/admin/all', auth, async (req, res, next) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (p - 1) * l;
    const q = {};
    if (search && String(search).trim()) {
      q.name = new RegExp(String(search).trim(), 'i');
    }
    const [products, total] = await Promise.all([
      Product.find(q).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      Product.countDocuments(q),
    ]);
    res.json({ products, total, page: p, totalPages: Math.ceil(total / l) || 1 });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const list = CATEGORY_ENUM.map((category) => ({
      category,
      count: map[category] || 0,
    }));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      categories,
      gender,
      minPrice,
      maxPrice,
      featured,
      search,
      page = '1',
      limit = '12',
    } = req.query;

    const q = { isActive: true };
    let catList = [];
    if (categories) {
      catList = String(categories)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (category) {
      catList = Array.isArray(category) ? category : [category];
    }
    if (catList.length === 1) q.category = catList[0];
    else if (catList.length > 1) q.category = { $in: catList };
    if (gender) q.gender = gender;
    if (minPrice !== undefined || maxPrice !== undefined) {
      q.price = {};
      if (minPrice !== undefined) q.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) q.price.$lte = Number(maxPrice);
    }
    if (featured === 'true') q.isFeatured = true;

    if (search && String(search).trim()) {
      const s = String(search).trim();
      const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      q.$or = [
        { name: re },
        { description: re },
        { tags: re },
      ];
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (p - 1) * l;

    const [products, total] = await Promise.all([
      Product.find(q).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      Product.countDocuments(q),
    ]);

    res.json({
      products,
      total,
      page: p,
      totalPages: Math.ceil(total / l) || 1,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/product/:id', auth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, uploadFields, async (req, res, next) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const files = req.files?.images || [];
    if (!data.images || !Array.isArray(data.images)) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    if (files.length < data.images.length) {
      return res.status(400).json({ error: 'Each color variant requires an image upload' });
    }
    data.images = data.images.map((img, i) => ({
      ...img,
      imagePath: `/uploads/products/${files[i].filename}`,
    }));
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth, uploadFields, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const data = req.body.data ? JSON.parse(req.body.data) : {};
    const files = req.files?.images || [];
    const replaceIdx = Array.isArray(data.replaceIndices) ? data.replaceIndices : [];

    if (data.images && Array.isArray(data.images)) {
      for (let j = 0; j < files.length; j++) {
        const i = replaceIdx[j] != null ? replaceIdx[j] : j;
        if (i == null || !files[j]) continue;
        const oldPath = product.images[i]?.imagePath;
        if (oldPath && oldPath.startsWith('/uploads/')) {
          const abs = path.join(__dirname, '..', oldPath);
          if (fs.existsSync(abs)) fs.unlinkSync(abs);
        }
        data.images[i].imagePath = `/uploads/products/${files[j].filename}`;
      }
      for (let i = 0; i < data.images.length; i++) {
        if (!data.images[i].imagePath && product.images[i]) {
          data.images[i].imagePath = product.images[i].imagePath;
        }
      }
    }

    delete data.replaceIndices;
    Object.assign(product, data);
    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.isActive = false;
    await product.save();
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/toggle-featured', auth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.isFeatured = !product.isFeatured;
    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reactivate', auth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.isActive = true;
    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
