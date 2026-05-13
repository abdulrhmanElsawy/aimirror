// server/services/geminiService.js
// AI try-on via Google Gemini (replaces Hugging Face / Gradio).
// Input: user photo path + product image path + text prompt
// Output: { imageUrl, source, details } with image under uploads/sessions/

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';

function buildServiceError(message, status = 500, code = 'SERVICE_ERROR') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw buildServiceError('Missing GEMINI_API_KEY in server environment.', 500, 'MISSING_AI_CONFIG');
  }
  return new GoogleGenerativeAI(key);
}

function fileToBase64(filePath) {
  const absolutePath = path.resolve(filePath);
  const buffer = fs.readFileSync(absolutePath);
  return buffer.toString('base64');
}

async function urlToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw buildServiceError(`Failed to download product image (${res.status}).`, 502, 'PRODUCT_IMAGE_DOWNLOAD');
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString('base64');
}

function getMimeType(filePathOrUrl) {
  let ext = '';
  try {
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
      ext = path.extname(new URL(filePathOrUrl).pathname).toLowerCase().replace('.', '');
    } else {
      ext = path.extname(filePathOrUrl).toLowerCase().replace('.', '');
    }
  } catch {
    ext = path.extname(String(filePathOrUrl)).toLowerCase().replace('.', '');
  }
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeMap[ext] || 'image/jpeg';
}

function writeResultFile(sessionId, imgBuf) {
  const outDir = path.join(__dirname, '..', 'uploads', 'sessions');
  const outPath = path.join(outDir, `${sessionId}-result.jpg`);
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, imgBuf);
  } catch (err) {
    throw buildServiceError(
      'Cannot save try-on image on this host (filesystem not writable, e.g. Vercel serverless). Use object/blob storage for production.',
      503,
      'STORAGE_UNAVAILABLE'
    );
  }
  return `/uploads/sessions/${sessionId}-result.jpg`;
}

function fallbackCopyUserImage(sessionId, userImagePath) {
  if (process.env.TRYON_FALLBACK_COPY_USER_IMAGE !== 'true') return null;
  const outDir = path.join(__dirname, '..', 'uploads', 'sessions');
  const outPath = path.join(outDir, `${sessionId}-result.jpg`);
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.copyFileSync(userImagePath, outPath);
  } catch {
    return null;
  }
  return {
    imageUrl: `/uploads/sessions/${sessionId}-result.jpg`,
    source: 'fallback',
    details: 'Gemini unavailable; returned copied user photo for local testing.',
  };
}

function extractImageBufferFromResponse(result) {
  const response = result.response;
  const cand = response.candidates?.[0];
  if (!cand) {
    const fb = response.promptFeedback;
    const reason = fb?.blockReason || 'no candidates';
    throw buildServiceError(`Gemini returned no candidates (${reason}).`, 502, 'GEMINI_NO_CANDIDATES');
  }
  const parts = cand.content?.parts || [];
  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) {
      return Buffer.from(inline.data, 'base64');
    }
  }
  throw buildServiceError('Gemini did not return an image in the response.', 502, 'GEMINI_NO_IMAGE');
}

/**
 * @returns {Promise<{ imageUrl: string, source: string, details: string }>}
 */
async function generateTryOnImage(sessionId, userImagePath, productImagePath) {
  const userBuf = fs.readFileSync(userImagePath);
  if (!userBuf.length) {
    throw buildServiceError('User image file is empty', 400, 'INVALID_INPUT_IMAGE');
  }

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: GEMINI_IMAGE_MODEL,
      generationConfig: {
        // Required for native image output on image-capable Gemini models
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const userImageBase64 = fileToBase64(userImagePath);
    const userImageMime = getMimeType(userImagePath);

    let productImageBase64;
    let productImageMime;
    if (productImagePath.startsWith('http://') || productImagePath.startsWith('https://')) {
      productImageBase64 = await urlToBase64(productImagePath);
      productImageMime = getMimeType(productImagePath);
    } else {
      const pBuf = fs.readFileSync(productImagePath);
      if (!pBuf.length) {
        throw buildServiceError('Product image file is empty', 400, 'INVALID_INPUT_IMAGE');
      }
      productImageBase64 = fileToBase64(productImagePath);
      productImageMime = getMimeType(productImagePath);
    }

    const prompt = `You are given two images:
Image 1 — the main photo of a person.
Image 2 — a clothing item I want the person to wear.

Your task:
Replace ONLY the clothing item on the person in Image 1 (the jacket, t-shirt, or suit) with the clothing item shown in Image 2.

Preserve everything else with pixel-perfect accuracy:
- The person's face, skin tone, hair, and expression
- Body pose, position, and proportions
- Background, lighting, and shadows
- Any accessories (glasses, jewelry, bag, shoes, etc.)
- The overall mood and color grading of the original photo

The replacement clothing must:
- Fit naturally on the person's body as if they are actually wearing it
- Follow the same lighting direction and shadow logic as the rest of the image
- Respect the fabric folds and wrinkles based on the pose
- Match the perspective and camera angle of the original photo

Do not change, enhance, or alter anything outside the clothing region. The final result should look like a seamless, photorealistic edit where only the garment has changed.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: userImageMime,
          data: userImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: productImageMime,
          data: productImageBase64,
        },
      },
      { text: prompt },
    ]);

    const resultImageData = extractImageBufferFromResponse(result);
    if (!resultImageData.length) {
      throw buildServiceError('Gemini returned an empty image.', 502, 'GEMINI_EMPTY_IMAGE');
    }

    const imageUrl = writeResultFile(sessionId, resultImageData);
    return {
      imageUrl,
      source: 'gemini',
      details: `Google Gemini (${GEMINI_IMAGE_MODEL}) generated try-on image.`,
    };
  } catch (err) {
    const fallback = fallbackCopyUserImage(sessionId, userImagePath);
    if (fallback) return fallback;

    console.error('Gemini generateTryOnImage error:', err);
    const msg = err?.message || String(err);
    if (err.status) throw err;
    throw buildServiceError(msg, 502, err.code || 'GEMINI_REQUEST_FAILED');
  }
}

/**
 * @param {string} eventType
 * @param {Array<{ id?: string, _id?: string, name?: string, category?: string }>} productSummaries
 * @returns {Promise<string>}
 */
async function suggestProductIdForEvent(eventType, productSummaries) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: GEMINI_TEXT_MODEL,
    });

    const prompt = `You are a fashion assistant.
A user is going to a ${eventType} event.
Here are available clothing products in JSON format:
${JSON.stringify(productSummaries, null, 2)}

Return ONLY the MongoDB _id string of the single best matching product for this event.
No explanation, no formatting, just the raw ID string.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const objectIdMatch = responseText.match(/[a-f0-9]{24}/i);
    if (objectIdMatch) {
      return objectIdMatch[0];
    }

    return productSummaries[0]?.id || productSummaries[0]?._id || '';
  } catch (error) {
    console.error('Gemini suggestProductIdForEvent error:', error);
    return productSummaries[0]?.id || productSummaries[0]?._id || '';
  }
}

module.exports = {
  generateTryOnImage,
  suggestProductIdForEvent,
};
