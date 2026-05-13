# CURSOR_TASKS.md
# AIMirror — Migration to Gemini + Vercel Deployment Tasks
# Give this file to Cursor along with CURSOR_PROMPT.md

---

## TASK 1 — Install Gemini SDK in the server

In the `server/` directory, install the Google Generative AI package:

```bash
cd server
npm install @google/generative-ai
```

Also install it in the root if needed for any shared scripts:
```bash
npm install @google/generative-ai
```

Confirm the package appears in `server/package.json` under dependencies.

---

## TASK 2 — Rewrite `server/services/geminiService.js`

Replace the entire contents of `server/services/geminiService.js` with the following implementation that uses Google Gemini instead of Hugging Face:

```javascript
// server/services/geminiService.js
// Handles AI image generation using Google Gemini API
// Input: user photo path + product image path + text prompt
// Output: saves result image to uploads/sessions/{sessionId}-result.jpg

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Convert a local file to base64 string
 */
function fileToBase64(filePath) {
  const absolutePath = path.resolve(filePath);
  const buffer = fs.readFileSync(absolutePath);
  return buffer.toString("base64");
}

/**
 * Download an image from a URL and convert to base64
 */
function urlToBase64(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString("base64"));
      });
      response.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Get mime type from file path or URL
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeMap[ext] || "image/jpeg";
}

/**
 * Main try-on generation function
 * Called by routes/tryon.js
 *
 * @param {string} sessionId - Session identifier
 * @param {string} userImagePath - Local path to the user's photo (e.g. uploads/sessions/xxx-user.jpg)
 * @param {string} productImagePath - Local path OR public URL to the product image
 * @returns {string} - Local path to the generated result image
 */
export async function generateTryOnImage(sessionId, userImagePath, productImagePath) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
    });

    // Load user image (always a local file)
    const userImageBase64 = fileToBase64(userImagePath);
    const userImageMime = getMimeType(userImagePath);

    // Load product image (local file or URL)
    let productImageBase64;
    let productImageMime;

    if (productImagePath.startsWith("http://") || productImagePath.startsWith("https://")) {
      productImageBase64 = await urlToBase64(productImagePath);
      productImageMime = getMimeType(productImagePath);
    } else {
      productImageBase64 = fileToBase64(productImagePath);
      productImageMime = getMimeType(productImagePath);
    }

    const prompt = `You are a professional virtual try-on AI. 
The first image is a person. The second image is a clothing item.
Generate a realistic image of the person wearing the clothing item.
Keep the person's face, body shape, pose, and background the same.
Only replace or overlay the clothing naturally on their body.
Make it look photorealistic and natural.`;

    // Call Gemini API with both images and the prompt
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

    const response = result.response;
    const parts = response.candidates[0].content.parts;

    // Find the image part in the response
    const imagePart = parts.find((part) => part.inlineData);

    if (!imagePart) {
      throw new Error("Gemini did not return an image in the response");
    }

    // Save the result image to disk
    const resultImageData = Buffer.from(imagePart.inlineData.data, "base64");
    const resultPath = `uploads/sessions/${sessionId}-result.jpg`;
    fs.writeFileSync(path.resolve(`server/${resultPath}`), resultImageData);

    return `/${resultPath}`;
  } catch (error) {
    console.error("Gemini generateTryOnImage error:", error);

    // Fallback: copy user image as result if TRYON_FALLBACK_COPY_USER_IMAGE is set
    if (process.env.TRYON_FALLBACK_COPY_USER_IMAGE === "true") {
      const resultPath = `uploads/sessions/${sessionId}-result.jpg`;
      fs.copyFileSync(
        path.resolve(userImagePath),
        path.resolve(`server/${resultPath}`)
      );
      return `/${resultPath}`;
    }

    throw error;
  }
}

/**
 * Suggest a product ID for a given event type using Gemini text
 * Replaces the old Hugging Face Inference text call
 *
 * @param {string} eventType - e.g. "wedding", "casual", "office"
 * @param {Array} productSummaries - Array of { id, name, category, description }
 * @returns {string} - MongoDB product ID
 */
export async function suggestProductIdForEvent(eventType, productSummaries) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `You are a fashion assistant. 
A user is going to a ${eventType} event.
Here are available clothing products in JSON format:
${JSON.stringify(productSummaries, null, 2)}

Return ONLY the MongoDB _id string of the single best matching product for this event.
No explanation, no formatting, just the raw ID string.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Try to extract a valid MongoDB ObjectId from response
    const objectIdMatch = responseText.match(/[a-f0-9]{24}/i);
    if (objectIdMatch) {
      return objectIdMatch[0];
    }

    // Fallback: return first product id
    return productSummaries[0]?.id || productSummaries[0]?._id;
  } catch (error) {
    console.error("Gemini suggestProductIdForEvent error:", error);
    // Fallback to first product
    return productSummaries[0]?.id || productSummaries[0]?._id;
  }
}
```

---

## TASK 3 — Add `GEMINI_API_KEY` to server environment files

**3a.** Open `server/.env` and add this line:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**3b.** Open `server/.env.example` and add this line (no real key):
```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## TASK 4 — Create Vercel configuration file at the project root

Create a new file at the root of the project (same level as `package.json`) called `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "client-tryon/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "client-store/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "client-tryon/dist/$1"
    }
  ]
}
```

---

## TASK 5 — Update `server/server.js` to support serverless (Vercel) deployment

Open `server/server.js` and make sure the file exports the Express app for serverless environments. Find the section at the bottom where the server starts listening and wrap it like this:

Find this pattern (or similar):
```javascript
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Replace it with:
```javascript
// Support both local (npm run dev) and Vercel serverless
if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
```

Also make sure the very top of the file uses ES module syntax consistently (since the project uses `import`/`export`). If the file uses `module.exports`, keep it as CommonJS and use `module.exports = app` instead.

---

## TASK 6 — Update `client-tryon/vite.config.js` for production API URL

Open `client-tryon/vite.config.js`. It currently proxies `/api` to `localhost:5000` for development. This is fine for dev — but for production (Vercel), the React app will call `/api` which Vercel routes to the serverless function automatically.

Make sure the config looks like this:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
```

---

## TASK 7 — Update `client-store/vite.config.js` for production

Same update for the store client:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
```

---

## TASK 8 — Add build scripts to `client-tryon/package.json` and `client-store/package.json`

Vercel needs a `vercel-build` script in each client package.json to know how to build them.

**In `client-tryon/package.json`**, make sure the scripts section includes:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "vercel-build": "vite build",
  "preview": "vite preview"
}
```

**In `client-store/package.json`**, same pattern:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "vercel-build": "vite build",
  "preview": "vite preview"
}
```

---

## TASK 9 — Create `.vercelignore` at the project root

Create a `.vercelignore` file at the root to exclude unnecessary files from deployment:

```
node_modules
server/uploads
*.log
.env
server/.env
client-store/.env
client-tryon/.env
```

---

## TASK 10 — Update `server/.env.example` with all required Vercel environment variables

Make sure `server/.env.example` documents ALL environment variables that need to be set on Vercel's dashboard:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aimirror

# Auth
JWT_SECRET=your_jwt_secret_here

# Server
PORT=5000
NODE_ENV=production

# Client URLs (for CORS)
CLIENT_STORE_URL=https://your-store.vercel.app
CLIENT_TRYON_URL=https://your-tryon.vercel.app

# Public URL (used for WhatsApp media links)
PUBLIC_BASE_URL=https://your-api.vercel.app

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# WhatsApp (choose one provider)
WHATSAPP_PROVIDER=twilio

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Meta WhatsApp (alternative)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/your_phone_id/messages
WHATSAPP_API_TOKEN=your_meta_token

# Fallback for local testing (set to true to copy user image as result)
TRYON_FALLBACK_COPY_USER_IMAGE=false
```

---

## TASK 11 — Test locally before deploying

Run these commands to confirm everything works locally:

```bash
# From the project root
npm run dev
```

Then open `http://localhost:5174` and test the try-on flow:
1. Upload a photo
2. Pick a product
3. Click generate
4. Confirm the result image is generated by Gemini (check server logs)

If generation fails, check:
- `server/.env` has the correct `GEMINI_API_KEY`
- The Gemini API key has access to `gemini-2.0-flash-preview-image-generation`
- Check server console for specific error messages

---

## TASK 12 — Push to GitHub

Make sure all changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "feat: migrate to Gemini API and prepare for Vercel deployment"
git push origin main
```

Ensure your `.gitignore` includes:
```
node_modules/
server/.env
client-store/.env
client-tryon/.env
server/uploads/sessions/
dist/
```

---

## ALL TASKS COMPLETE

After Task 12, the project is ready to deploy on Vercel.
Follow the step-by-step Vercel deployment guide in `VERCEL_DEPLOY_GUIDE.md`.