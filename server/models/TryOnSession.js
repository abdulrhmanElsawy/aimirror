const mongoose = require('mongoose');

const tryOnSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userPhoto: { type: String, default: '' },
  selectedProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  selectedVariant: { type: String, default: '' },
  generatedImagePath: { type: String, default: '' },
  mode: { type: String, enum: ['manual', 'auto'], default: 'manual' },
  autocategory: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'done', 'error'],
    default: 'pending',
  },
  whatsappNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

module.exports = mongoose.model('TryOnSession', tryOnSessionSchema);
