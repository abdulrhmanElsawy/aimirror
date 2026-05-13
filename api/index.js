// api/index.js
// Vercel serverless function — forwards /api/* to Express (see server/server.js).

const app = require('../server/server.js');

module.exports = app;
