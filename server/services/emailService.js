const fs = require('fs');
const nodemailer = require('nodemailer');

function createTransporter() {
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendImageByEmail(toEmail, imagePath) {
  const transporter = createTransporter();
  const imageBuffer = fs.readFileSync(imagePath);
  await transporter.sendMail({
    from: 'Clothing Store <noreply@store.com>',
    to: toEmail,
    subject: 'Your Virtual Try-On Result',
    html:
      '<p>Thank you for trying our virtual try-on feature!</p><p>Find your personalized outfit image attached.</p>',
    attachments: [{ filename: 'your-outfit.jpg', content: imageBuffer }],
  });
}

module.exports = { sendImageByEmail };
