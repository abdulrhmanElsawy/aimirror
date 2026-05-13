const express = require('express');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const TryOnSession = require('../models/TryOnSession');
const Product = require('../models/Product');
const { uploadUserPhoto } = require('../middleware/upload');
const {
  generateTryOnImage,
  suggestProductIdForEvent,
} = require('../services/geminiService');
const { sendImageToWhatsApp } = require('../services/whatsappService');
const { sendImageByEmail } = require('../services/emailService');

const router = express.Router();

function isDocMissingError(err) {
  return err?.name === 'DocumentNotFoundError';
}

async function safeSaveSession(session) {
  try {
    await session.save();
    return true;
  } catch (err) {
    if (isDocMissingError(err)) return false;
    throw err;
  }
}

function sessionAbs(relOrAbs) {
  const rel = relOrAbs.startsWith('/') ? relOrAbs.slice(1) : relOrAbs;
  return path.join(__dirname, '..', rel);
}

router.post('/start', (req, res, next) => {
  const sessionId = nanoid();
  req._sessionIdForUpload = sessionId;
  req._newSessionId = sessionId;
  next();
}, uploadUserPhoto.single('photo'), async (req, res, next) => {
  try {
    const sessionId = req._newSessionId;
    if (!req.file) {
      return res.status(400).json({ error: 'Photo required' });
    }
    const ext = path.extname(req.file.filename);
    const userRel = `/uploads/sessions/${sessionId}-user${ext}`;
    await TryOnSession.create({
      sessionId,
      userPhoto: userRel,
      status: 'pending',
    });
    res.json({ sessionId });
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/generate', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { productId, colorVariantIndex = 0, mode = 'manual' } = req.body;

    const session = await TryOnSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const idx = Number(colorVariantIndex) || 0;
    const variant = product.images[idx];
    if (!variant) return res.status(400).json({ error: 'Invalid color variant' });

    session.selectedProductId = product._id;
    session.selectedVariant = `${variant.color}|${variant.hex}`;
    session.mode = mode;
    session.status = 'processing';
    const processingSaved = await safeSaveSession(session);
    if (!processingSaved) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userAbs = sessionAbs(session.userPhoto);
    const productAbs = sessionAbs(variant.imagePath);

    try {
      const result = await generateTryOnImage(sessionId, userAbs, productAbs);
      session.generatedImagePath = result.imageUrl;
      session.status = 'done';
      const doneSaved = await safeSaveSession(session);
      if (!doneSaved) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json({
        imageUrl: result.imageUrl,
        source: result.source,
        details: result.details,
      });
    } catch (e) {
      session.status = 'error';
      const errorSaved = await safeSaveSession(session);
      if (!errorSaved) {
        return res.status(404).json({ error: 'Session not found' });
      }
      next(e);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/auto-generate', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { eventType } = req.body;
    const allowed = ['wedding', 'casual', 'office', 'party', 'formal'];
    if (!allowed.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }

    const session = await TryOnSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const products = await Product.find({ isActive: true }).lean();
    if (!products.length) {
      return res.status(400).json({ error: 'No products available' });
    }

    const summaries = products.map((p) => ({
      id: String(p._id),
      name: p.name,
      category: p.category,
      gender: p.gender,
    }));

    let chosenId = null;
    try {
      const raw = await suggestProductIdForEvent(eventType, summaries);
      const m = String(raw).match(/[a-fA-F0-9]{24}/);
      if (m && products.some((p) => String(p._id) === m[0])) chosenId = m[0];
    } catch {
      chosenId = null;
    }
    if (!chosenId) {
      chosenId = String(
        [...products].sort((a, b) => a.name.localeCompare(b.name))[0]._id
      );
    }

    const product = await Product.findById(chosenId);
    const variant = product.images[0];
    session.selectedProductId = product._id;
    session.selectedVariant = `${variant.color}|${variant.hex}`;
    session.mode = 'auto';
    session.autocategory = eventType;
    session.status = 'processing';
    const processingSaved = await safeSaveSession(session);
    if (!processingSaved) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userAbs = sessionAbs(session.userPhoto);
    const productAbs = sessionAbs(variant.imagePath);

    try {
      const result = await generateTryOnImage(sessionId, userAbs, productAbs);
      session.generatedImagePath = result.imageUrl;
      session.status = 'done';
      const doneSaved = await safeSaveSession(session);
      if (!doneSaved) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const suggestedProducts = [
        {
          id: String(product._id),
          name: product.name,
          category: product.category,
        },
      ];
      res.json({
        imageUrl: result.imageUrl,
        source: result.source,
        details: result.details,
        suggestedProducts,
      });
    } catch (e) {
      session.status = 'error';
      const errorSaved = await safeSaveSession(session);
      if (!errorSaved) {
        return res.status(404).json({ error: 'Session not found' });
      }
      next(e);
    }
  } catch (err) {
    next(err);
  }
});

function validatePhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  let d = digits;
  if (d.startsWith('0') && d.length === 11) d = `2${d}`;
  if (d.length >= 10 && d.length <= 15) return `+${d}`;
  return null;
}

router.post('/:sessionId/send-whatsapp', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    let { phoneNumber } = req.body;
    phoneNumber = validatePhone(phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const session = await TryOnSession.findOne({ sessionId });
    if (!session || !session.generatedImagePath) {
      return res.status(404).json({ error: 'No result image for session' });
    }

    await sendImageToWhatsApp(phoneNumber, session.generatedImagePath, sessionId);
    session.whatsappNumber = phoneNumber;
    await session.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/send-email', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { email } = req.body;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
    if (!ok) return res.status(400).json({ error: 'Invalid email address' });

    const session = await TryOnSession.findOne({ sessionId });
    if (!session || !session.generatedImagePath) {
      return res.status(404).json({ error: 'No result image for session' });
    }

    const abs = sessionAbs(session.generatedImagePath);
    await sendImageByEmail(email, abs);
    session.email = email;
    await session.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await TryOnSession.findOne({ sessionId });
    if (session) {
      const paths = [session.userPhoto, session.generatedImagePath].filter(Boolean);
      for (const rel of paths) {
        const abs = sessionAbs(rel);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
      await session.deleteOne();
    }
    res.json({ message: 'Session cleared' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
