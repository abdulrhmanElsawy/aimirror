const mongoose = require('mongoose');

const CATEGORY_ENUM = [
  'jacket', 'tshirt', 'trousers', 'dress', 'shirt', 'jeans', 'blouse', 'coat',
  'skirt', 'suit', 'hoodie', 'shorts', 'abaya', 'kaftan', 'other',
];

const imageSchema = new mongoose.Schema({
  color: { type: String, required: true },
  hex: { type: String, required: true },
  imagePath: { type: String, required: true },
}, { _id: false });

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, enum: CATEGORY_ENUM },
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'EGP' },
  images: {
    type: [imageSchema],
    validate: [(v) => Array.isArray(v) && v.length >= 1, 'At least one image variant'],
  },
  sizes: { type: [sizeSchema], default: [] },
  tags: { type: [String], default: [] },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', tags: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORY_ENUM = CATEGORY_ENUM;
