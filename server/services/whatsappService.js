const fs = require('fs');
const path = require('path');

function publicUrlForPath(imagePath) {
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const rel = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${base}${rel}`;
}

async function sendImageToWhatsApp(phoneNumber, imagePath, sessionId) {
  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();

  const fullPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(__dirname, '..', imagePath.replace(/^\//, ''));

  if (!fs.existsSync(fullPath)) {
    throw new Error('Image file not found');
  }

  const mediaUrl = publicUrlForPath(imagePath.startsWith('/') ? imagePath : `/${imagePath}`);

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNum = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!accountSid || !authToken || !fromNum) {
      throw new Error('Twilio WhatsApp is not fully configured');
    }
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const digits = String(phoneNumber).replace(/\D/g, '');
    const toE164 = `+${digits}`;
    let fromW = String(fromNum).trim();
    if (!fromW.startsWith('whatsapp:')) {
      const fd = fromW.replace(/\D/g, '');
      fromW = `whatsapp:+${fd}`;
    }
    const body = new URLSearchParams({
      To: `whatsapp:${toE164}`,
      From: fromW,
      Body: 'Your personalized outfit from our store!',
      MediaUrl: mediaUrl,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Twilio send failed');
    }
    return { success: true };
  }

  const token = process.env.WHATSAPP_API_TOKEN;
  const graphUrl = process.env.WHATSAPP_API_URL;
  if (!token || !graphUrl) {
    throw new Error('Meta WhatsApp API is not configured');
  }
  const res = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: String(phoneNumber).replace(/\D/g, ''),
      type: 'image',
      image: {
        link: mediaUrl,
        caption: 'Your personalized outfit!',
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'WhatsApp API send failed');
  }
  return { success: true };
}

module.exports = { sendImageToWhatsApp, publicUrlForPath };
