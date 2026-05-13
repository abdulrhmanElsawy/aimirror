const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, PageNumber, PageBreak
  } = require('docx');
  const fs = require('fs');
  
  const COLORS = {
    primary: '1D3FA6',
    secondary: '6680C2',
    tertiary: 'FF4FB4',
    neutral: 'F2EEE4',
    surface: 'FAF6EC',
    headerBg: '1D3FA6',
    sectionBg: 'EEF2FF',
    taskBg: 'FAF6EC',
    borderColor: '6680C2',
    pink: 'FF4FB4',
    white: 'FFFFFF',
    darkText: '0A1240',
    gray: 'D0D5E8',
  };
  
  const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderColor };
  const borders = { top: border, bottom: border, left: border, right: border };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  
  function heading1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 160 },
      children: [new TextRun({ text, bold: true, font: 'Arial', size: 32, color: COLORS.primary })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.pink } },
    });
  }
  
  function heading2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text, bold: true, font: 'Arial', size: 26, color: COLORS.secondary })],
    });
  }
  
  function heading3(text) {
    return new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text, bold: true, font: 'Arial', size: 22, color: COLORS.primary })],
    });
  }
  
  function para(text, options = {}) {
    return new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text, font: 'Arial', size: 20, color: COLORS.darkText, ...options })],
    });
  }
  
  function bullet(text, level = 0) {
    return new Paragraph({
      numbering: { reference: 'bullets', level },
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, font: 'Arial', size: 20, color: COLORS.darkText })],
    });
  }
  
  function numbered(text, level = 0) {
    return new Paragraph({
      numbering: { reference: 'numbers', level },
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, font: 'Arial', size: 20, color: COLORS.darkText })],
    });
  }
  
  function taskRow(id, task, details, priority, status) {
    const cellStyle = (text, bg = COLORS.taskBg, bold = false, color = COLORS.darkText) =>
      new TableCell({
        borders,
        width: { size: 0, type: WidthType.AUTO },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: 'top',
        children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 18, bold, color })] })],
      });
  
    const priorityColor = priority === 'CRITICAL' ? 'FF4FB4' :
      priority === 'HIGH' ? '1D3FA6' : priority === 'MED' ? '6680C2' : 'A0A8C8';
  
    return new TableRow({
      children: [
        cellStyle(id, COLORS.sectionBg, true, COLORS.primary),
        cellStyle(task, COLORS.taskBg, true, COLORS.darkText),
        cellStyle(details, COLORS.taskBg, false, COLORS.darkText),
        cellStyle(priority, COLORS.taskBg, true, priorityColor),
        cellStyle(status, COLORS.taskBg, false, '8090A0'),
      ],
    });
  }
  
  function tableHeader() {
    const hCell = (text) => new TableCell({
      borders,
      shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: COLORS.white })] })],
    });
    return new TableRow({
      children: [hCell('ID'), hCell('Task'), hCell('Details / Acceptance Criteria'), hCell('P'), hCell('Status')],
      tableHeader: true,
    });
  }
  
  function sectionTable(rows) {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [900, 2100, 4860, 600, 900],
      rows: [tableHeader(), ...rows],
    });
  }
  
  function divider() {
    return new Paragraph({
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.gray } },
      children: [new TextRun('')],
    });
  }
  
  function noteBox(text) {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({
        children: [new TableCell({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.pink },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gray },
            left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.pink },
            right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gray },
          },
          shading: { fill: 'FFF0F8', type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 180, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 18, color: COLORS.darkText, italics: true })] })],
        })],
      })],
    });
  }
  
  // ─── DOCUMENT SECTIONS ────────────────────────────────────────────────────────
  
  const titleSection = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 80 },
      children: [new TextRun({ text: 'FULL PROJECT BUILD TASKS', font: 'Arial', size: 52, bold: true, color: COLORS.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: 'Clothing Store + AI Virtual Try-On Platform', font: 'Arial', size: 28, color: COLORS.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: 'Stack: React + Vite • Node.js • MongoDB • CSS Modules', font: 'Arial', size: 20, color: COLORS.tertiary, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: 'Design System: Risograph — #1D3FA6 / #FF4FB4 / #F2EEE4 • Space Grotesk + Space Mono', font: 'Arial', size: 18, color: COLORS.secondary })],
    }),
    divider(),
  ];
  
  // ─── LEGEND ──────────────────────────────────────────────────────────────────
  
  const legendSection = [
    heading1('📋 HOW TO USE THIS DOCUMENT'),
    para('Each row in the task tables below describes one atomic unit of work. The agent should complete tasks in the order they appear within each section. Sections themselves should be built in the order listed in this document.'),
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: 'Priority Key:', font: 'Arial', size: 20, bold: true, color: COLORS.primary })] }),
    bullet('CRITICAL — Must be done before anything else in the section can work'),
    bullet('HIGH — Core feature, do this first after CRITICAL tasks'),
    bullet('MED — Important but the system still loads without it'),
    bullet('LOW — Enhancement, do last'),
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [new TextRun({ text: 'Status column starts as TODO for every task.', font: 'Arial', size: 18, color: COLORS.secondary, italics: true })] }),
    divider(),
  ];
  
  // ─── SEC 0: GLOBAL DESIGN CONSTANTS ─────────────────────────────────────────
  
  const sec0 = [
    heading1('SECTION 0 — GLOBAL DESIGN SYSTEM & CONSTANTS'),
    para('Every file in this project must import fonts and variables from the global design system. No component may hardcode colors, font families, font sizes, spacing, or border-radius values.'),
    noteBox('Design System Rule: Exactly ONE primary action (tertiary pink #FF4FB4) per screen. Never use two pink buttons on the same view.'),
    heading2('0A. Font Import'),
    para('In index.html <head>, load both Google Fonts:'),
    bullet('Space Grotesk: weights 400, 700 — used for all display, h1, body text'),
    bullet('Space Mono: weight 400 — used for labels, tags, metadata only'),
    heading2('0B. CSS Custom Properties — :root in global.module.css'),
    bullet('--color-primary: #1D3FA6'),
    bullet('--color-secondary: #6680C2'),
    bullet('--color-tertiary: #FF4FB4  ← the ONE interaction color'),
    bullet('--color-neutral: #F2EEE4'),
    bullet('--color-surface: #FAF6EC'),
    bullet('--color-on-primary: #FAF6EC'),
    bullet('--font-display: "Space Grotesk", sans-serif'),
    bullet('--font-body: "Space Grotesk", sans-serif'),
    bullet('--font-label: "Space Mono", monospace'),
    bullet('--font-size-display: 4.25rem'),
    bullet('--font-size-h1: 2.25rem'),
    bullet('--font-size-body: 1rem'),
    bullet('--font-size-label: 0.75rem'),
    bullet('--letter-spacing-display: -0.03em'),
    bullet('--letter-spacing-label: 0.04em'),
    bullet('--line-height-body: 1.55'),
    bullet('--radius-sm: 2px'),
    bullet('--radius-md: 4px'),
    bullet('--radius-lg: 8px'),
    bullet('--spacing-sm: 8px'),
    bullet('--spacing-md: 16px'),
    bullet('--spacing-lg: 32px'),
    heading2('0C. Component Token Definitions'),
    bullet('Button Primary: bg=var(--color-tertiary), color=var(--color-on-primary), radius=var(--radius-md), padding=12px 20px, font=var(--font-label), letter-spacing=var(--letter-spacing-label)'),
    bullet('Card: bg=var(--color-surface), color=var(--color-primary), radius=var(--radius-lg), padding=24px'),
    bullet('NO gradients anywhere in the project'),
    bullet('NO second accent color — tertiary pink is the only interactive color'),
    bullet('Negative space is intentional — do not fill every whitespace'),
    divider(),
  ];
  
  // ─── SEC 1: PROJECT SCAFFOLD ─────────────────────────────────────────────────
  
  const sec1 = [
    heading1('SECTION 1 — PROJECT SCAFFOLD & MONOREPO SETUP'),
    para('The project is a monorepo with two apps sharing one MongoDB instance. The clothing store (browse-only) and the AI Try-On Tool are separate React Vite apps but share the Node.js backend.'),
    heading2('1A. Repository Structure'),
    sectionTable([
      taskRow('1A-01', 'Create root monorepo folder', 'Folder: /clothing-platform\nCreate /client-store, /client-tryon, /server subfolders', 'CRITICAL', 'TODO'),
      taskRow('1A-02', 'Init /client-store with Vite + React', 'Run: npm create vite@latest client-store -- --template react\nDelete boilerplate: App.css, logo.svg, assets/react.svg', 'CRITICAL', 'TODO'),
      taskRow('1A-03', 'Init /client-tryon with Vite + React', 'Run: npm create vite@latest client-tryon -- --template react\nDelete boilerplate: same as above', 'CRITICAL', 'TODO'),
      taskRow('1A-04', 'Init /server with Node.js', 'npm init -y inside /server\nInstall: express, mongoose, cors, dotenv, multer, jsonwebtoken, bcryptjs, nodemon', 'CRITICAL', 'TODO'),
      taskRow('1A-05', 'Root package.json scripts', 'Add concurrent start scripts:\n"dev:store": cd client-store && npm run dev\n"dev:tryon": cd client-tryon && npm run dev\n"dev:server": cd server && npm run dev\n"dev": run all three concurrently', 'HIGH', 'TODO'),
      taskRow('1A-06', 'Create .env.example files', '/server/.env.example:\nMONGO_URI=\nJWT_SECRET=\nGEMINI_API_KEY=\nPORT=5000\nSMTP_HOST=, SMTP_PORT=, SMTP_USER=, SMTP_PASS=\nWHATSAPP_API_URL=\nWHATSAPP_API_TOKEN=\nCLIENT_STORE_URL=http://localhost:5173\nCLIENT_TRYON_URL=http://localhost:5174', 'CRITICAL', 'TODO'),
      taskRow('1A-07', 'Create .gitignore at root', 'Ignore: node_modules/, .env, dist/, .DS_Store\nApply to all three subfolders', 'HIGH', 'TODO'),
    ]),
    heading2('1B. Vite Configuration'),
    sectionTable([
      taskRow('1B-01', 'Set dev port for client-store', 'vite.config.js: server: { port: 5173 }\nProxy /api → http://localhost:5000', 'CRITICAL', 'TODO'),
      taskRow('1B-02', 'Set dev port for client-tryon', 'vite.config.js: server: { port: 5174 }\nProxy /api → http://localhost:5000', 'CRITICAL', 'TODO'),
      taskRow('1B-03', 'CSS Modules config', 'Both Vite configs: css: { modules: { localsConvention: "camelCase" } }', 'HIGH', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 2: DATABASE MODELS ──────────────────────────────────────────────────
  
  const sec2 = [
    heading1('SECTION 2 — DATABASE (MongoDB + Mongoose)'),
    noteBox('ALL image fields store only the relative path string (e.g. "/uploads/products/jacket-blue-m.png"). The client constructs the full URL from the base API URL. Never store absolute URLs in the DB.'),
    heading2('2A. MongoDB Connection'),
    sectionTable([
      taskRow('2A-01', 'Create /server/config/db.js', 'Export async connectDB() using mongoose.connect(process.env.MONGO_URI)\nLog "MongoDB Connected" on success\nCall this in server.js before app.listen()', 'CRITICAL', 'TODO'),
    ]),
    heading2('2B. Product Model'),
    sectionTable([
      taskRow('2B-01', 'Create /server/models/Product.js', 'Fields:\nname: String, required\ncategory: String, required, enum: ["jacket","tshirt","trousers","dress","shirt","jeans","blouse","coat","skirt","suit","hoodie","shorts","abaya","kaftan","other"]\ngender: String, enum: ["men","women","unisex"]\ndescription: String\nprice: Number, required, min: 0\ncurrency: String, default: "EGP"\nimages: [{ color: String, hex: String, imagePath: String }] — array, at least 1 required\nsizes: [{ size: String, stock: Number }] — sizes like "XS","S","M","L","XL","XXL","One Size"\ntags: [String]\nisFeatured: Boolean, default: false\nisActive: Boolean, default: true\ncreatedAt: Date, default: Date.now', 'CRITICAL', 'TODO'),
    ]),
    heading2('2C. Admin User Model'),
    sectionTable([
      taskRow('2C-01', 'Create /server/models/AdminUser.js', 'Fields:\nusername: String, required, unique\npassword: String, required (bcrypt hashed)\nrole: String, default: "admin"\ncreatedAt: Date, default: Date.now\nPre-save hook: if password modified, hash with bcryptjs saltRounds=10\nInstance method: comparePassword(candidate) → returns boolean', 'CRITICAL', 'TODO'),
    ]),
    heading2('2D. Session Model (Try-On Tool)'),
    sectionTable([
      taskRow('2D-01', 'Create /server/models/TryOnSession.js', 'Fields:\nsessionId: String, required, unique (nanoid)\nuserPhoto: String (path to uploaded user image)\nselectedProductId: ObjectId ref Product\nselectedVariant: String (color/hex chosen)\ngeneratedImagePath: String (path to Gemini result)\nmode: String, enum: ["manual","auto"]\nautocategory: String (event type if auto mode)\nstatus: String, enum: ["pending","processing","done","error"]\nwhatsappNumber: String\nemail: String\ncreatedAt: Date, default: Date.now, expires: 3600 (auto-delete after 1hr)', 'HIGH', 'TODO'),
    ]),
    heading2('2E. Database Seeder'),
    sectionTable([
      taskRow('2E-01', 'Create /server/seeders/seed.js', 'Script that:\n1. Connects to MongoDB\n2. Deletes all Products\n3. Inserts sample data: 5 jackets, 5 tshirts, 5 trousers, 3 dresses, 3 suits (25 total)\nEach product has: name, category, gender, price (100–2000 EGP), 2 color variants with imagePaths pointing to /uploads/products/placeholder-{category}.png, sizes array with stock values\nRun with: node seeders/seed.js', 'MED', 'TODO'),
      taskRow('2E-02', 'Create placeholder product images', 'In /server/uploads/products/, create PNG placeholders for each category (can be colored rectangles with category text). These are replaced by real product images later via admin panel.', 'MED', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 3: BACKEND API ──────────────────────────────────────────────────────
  
  const sec3 = [
    heading1('SECTION 3 — BACKEND API (Node.js + Express)'),
    heading2('3A. Server Entry Point'),
    sectionTable([
      taskRow('3A-01', 'Create /server/server.js', 'Import: express, cors, dotenv, connectDB\nCORS config:\n  origin: [process.env.CLIENT_STORE_URL, process.env.CLIENT_TRYON_URL]\n  methods: GET, POST, PUT, DELETE, PATCH\n  allowedHeaders: Content-Type, Authorization\nMiddleware: express.json(), express.urlencoded({extended:true})\nStatic files: app.use("/uploads", express.static("uploads"))\nMount routes (defined below)\nListen on process.env.PORT || 5000', 'CRITICAL', 'TODO'),
      taskRow('3A-02', 'Create /server/middleware/auth.js', 'JWT middleware:\nRead Authorization header (Bearer token)\nVerify with process.env.JWT_SECRET\nAttach decoded payload to req.admin\nIf invalid/missing, return 401 { error: "Unauthorized" }', 'CRITICAL', 'TODO'),
      taskRow('3A-03', 'Create /server/middleware/upload.js', 'Multer config:\nStorage: diskStorage to uploads/products/ for products, uploads/sessions/ for try-on photos\nFile filter: only image/jpeg, image/png, image/webp\nMax size: 10MB for session photos, 5MB for product images\nExport: uploadProduct (single "image"), uploadUserPhoto (single "photo")', 'HIGH', 'TODO'),
    ]),
    heading2('3B. Product Routes'),
    sectionTable([
      taskRow('3B-01', 'GET /api/products', 'Public route. Query params supported:\n?category=jacket\n?gender=men|women|unisex\n?minPrice=100&maxPrice=2000\n?featured=true\n?search=keyword (matches name, tags, description)\n?page=1&limit=12 (default)\nReturn: { products: [...], total, page, totalPages }\nOnly return isActive:true products', 'CRITICAL', 'TODO'),
      taskRow('3B-02', 'GET /api/products/:id', 'Public route. Return single product by MongoDB _id.\nReturn 404 { error: "Product not found" } if missing or isActive:false', 'CRITICAL', 'TODO'),
      taskRow('3B-03', 'POST /api/products', 'Protected (auth middleware). Admin only.\nAccept multipart/form-data with "image" file + all Product fields as JSON body field called "data" (parse with JSON.parse(req.body.data))\nSave image to uploads/products/\nCreate and save Product document\nReturn 201 with created product', 'CRITICAL', 'TODO'),
      taskRow('3B-04', 'PUT /api/products/:id', 'Protected. Update product fields.\nIf new image uploaded, delete old file (fs.unlink), save new one\nReturn updated product', 'HIGH', 'TODO'),
      taskRow('3B-05', 'DELETE /api/products/:id', 'Protected. Soft delete: set isActive:false (do not actually delete from DB).\nReturn { message: "Product deactivated" }', 'HIGH', 'TODO'),
      taskRow('3B-06', 'PATCH /api/products/:id/toggle-featured', 'Protected. Toggle isFeatured boolean.\nReturn updated product.', 'MED', 'TODO'),
      taskRow('3B-07', 'GET /api/products/categories', 'Public. Return array of all category enum values with their product count.\n[{ category: "jacket", count: 12 }, ...]', 'HIGH', 'TODO'),
    ]),
    heading2('3C. Auth Routes'),
    sectionTable([
      taskRow('3C-01', 'POST /api/auth/login', 'Body: { username, password }\nFind AdminUser by username\nCall comparePassword()\nIf match: sign JWT {id, username, role} with 24h expiry, return { token }\nIf no match: return 401 { error: "Invalid credentials" }', 'CRITICAL', 'TODO'),
      taskRow('3C-02', 'POST /api/auth/register-first-admin', 'Only works if AdminUser collection is EMPTY (no existing admins).\nCreate first admin from body { username, password }\nReturn { message: "Admin created" }\nAfter first admin exists, this endpoint returns 403.', 'HIGH', 'TODO'),
      taskRow('3C-03', 'GET /api/auth/me', 'Protected. Returns { username, role } from req.admin', 'MED', 'TODO'),
    ]),
    heading2('3D. Try-On Session Routes'),
    sectionTable([
      taskRow('3D-01', 'POST /api/tryon/start', 'Body: multipart with "photo" file.\nGenerate sessionId with nanoid()\nSave uploaded user photo to uploads/sessions/{sessionId}-user.{ext}\nCreate TryOnSession document with status:"pending"\nReturn { sessionId }', 'CRITICAL', 'TODO'),
      taskRow('3D-02', 'POST /api/tryon/:sessionId/generate', 'Body: { productId, colorVariantIndex, mode:"manual" }\nFind session, update selectedProductId + selectedVariant\nUpdate status to "processing"\nCall Gemini API (see Section 6) with:\n  - User photo (base64 from saved file)\n  - Product image (base64 from product imagePath)\n  - Full prompt from project spec (exactly as specified)\nSave Gemini result image to uploads/sessions/{sessionId}-result.{ext}\nUpdate session: generatedImagePath, status:"done"\nReturn { imageUrl: "/uploads/sessions/{sessionId}-result.{ext}" }', 'CRITICAL', 'TODO'),
      taskRow('3D-03', 'POST /api/tryon/:sessionId/auto-generate', 'Body: { eventType: "wedding"|"casual"|"office"|"party"|"formal" }\nFetch all active products from DB\nBuild a prompt for Gemini telling it the user photo + event type + list of available product names/categories\nGemini should suggest which products to use (return JSON array of productIds)\nFor each suggested product, fetch from DB and prepare the try-on\nGenerate 1 combined outfit image (or pick first matched product and generate)\nReturn { imageUrl, suggestedProducts: [{id, name, category}] }', 'HIGH', 'TODO'),
      taskRow('3D-04', 'POST /api/tryon/:sessionId/send-whatsapp', 'Body: { phoneNumber } (format: country code + number, e.g. "201012345678")\nRead the generated result image from disk\nCall WhatsApp Business API (Twilio or WABA depending on env config)\nSend image message with caption "Your personalized outfit from our store!"\nReturn { success: true } or { error: "..." }', 'HIGH', 'TODO'),
      taskRow('3D-05', 'POST /api/tryon/:sessionId/send-email', 'Body: { email }\nUse nodemailer with SMTP env vars\nSend email with result image as attachment\nSubject: "Your Virtual Try-On Result"\nBody: "Here is your personalized outfit image."\nReturn { success: true }', 'HIGH', 'TODO'),
      taskRow('3D-06', 'DELETE /api/tryon/:sessionId', 'Delete TryOnSession document\nDelete both files: user photo + result image from disk (fs.unlink)\nReturn { message: "Session cleared" }', 'MED', 'TODO'),
    ]),
    heading2('3E. Error Handling Middleware'),
    sectionTable([
      taskRow('3E-01', 'Global error handler', 'Add at bottom of server.js:\napp.use((err, req, res, next) => { console.error(err); res.status(err.status||500).json({error: err.message||"Server error"}); })\nAll async route handlers must call next(err) on catch', 'HIGH', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 4: CLOTHING STORE FRONTEND ─────────────────────────────────────────
  
  const sec4 = [
    heading1('SECTION 4 — CLOTHING STORE FRONTEND (client-store)'),
    noteBox('This is a VIEW-ONLY store. No cart, no checkout, no purchase flow. Users browse and view products. The only CTA buttons are "Open Try-On Tool" (opens client-tryon in new tab) and category/filter controls.'),
    heading2('4A. Install Dependencies (client-store)'),
    sectionTable([
      taskRow('4A-01', 'Install client-store packages', 'npm install react-router-dom axios\nFonts are loaded via Google Fonts CDN in index.html (see Sec 0)\nNo UI library — use CSS Modules only', 'CRITICAL', 'TODO'),
    ]),
    heading2('4B. Global Styles'),
    sectionTable([
      taskRow('4B-01', 'Create src/styles/global.module.css', 'Define all CSS custom properties from Section 0 in :root\nBase styles: *, box-sizing: border-box; margin:0; padding:0\nbody: font-family: var(--font-body); background: var(--color-neutral); color: var(--color-primary)\nimg: max-width:100%; display:block\na: text-decoration:none; color:inherit', 'CRITICAL', 'TODO'),
      taskRow('4B-02', 'Import global.module.css in main.jsx', 'import styles from "./styles/global.module.css" — CSS custom properties become globally available', 'CRITICAL', 'TODO'),
    ]),
    heading2('4C. Router Setup'),
    sectionTable([
      taskRow('4C-01', 'Create routes in App.jsx', 'Routes:\n/ → <HomePage>\n/products → <ProductsPage>\n/products/:id → <ProductDetailPage>\n/admin/login → <AdminLoginPage>\n/admin → <AdminDashboard> (protected)\n/admin/products → <AdminProductsPage> (protected)\n/admin/products/new → <AdminAddProductPage> (protected)\n/admin/products/:id/edit → <AdminEditProductPage> (protected)\n\nWrap protected routes in <ProtectedRoute> component that checks JWT in localStorage', 'CRITICAL', 'TODO'),
    ]),
    heading2('4D. API Service Layer'),
    sectionTable([
      taskRow('4D-01', 'Create src/api/axios.js', 'Create axios instance:\nbaseURL: import.meta.env.VITE_API_URL (default http://localhost:5000)\nRequest interceptor: attach Authorization: Bearer {token} if token exists in localStorage\nResponse interceptor: on 401, clear localStorage token, redirect to /admin/login', 'CRITICAL', 'TODO'),
      taskRow('4D-02', 'Create src/api/products.js', 'Export functions:\ngetProducts(params) → GET /api/products with query params\ngetProduct(id) → GET /api/products/:id\ngetCategories() → GET /api/products/categories\ncreateProduct(formData) → POST /api/products (multipart)\nupdateProduct(id, formData) → PUT /api/products/:id\ndeactivateProduct(id) → DELETE /api/products/:id\ntoggleFeatured(id) → PATCH /api/products/:id/toggle-featured', 'CRITICAL', 'TODO'),
      taskRow('4D-03', 'Create src/api/auth.js', 'Export:\nlogin(username, password) → POST /api/auth/login\ngetMe() → GET /api/auth/me', 'CRITICAL', 'TODO'),
    ]),
    heading2('4E. Shared Components (client-store)'),
    sectionTable([
      taskRow('4E-01', 'Navbar component', 'File: src/components/Navbar/Navbar.jsx + Navbar.module.css\nLayout: Logo left (text "STORE NAME" in display font, primary color) | nav links center | "Try On AI" button right (tertiary pink, button-primary style)\nLinks: Home, Products, Categories\nResponsive: hamburger menu on <768px\nSticky top: position:sticky; top:0; z-index:100; background:var(--color-surface)\nBottom border: 1px solid var(--color-secondary)', 'CRITICAL', 'TODO'),
      taskRow('4E-02', 'Footer component', 'Simple: store name, tagline, copyright year\nBackground: var(--color-primary); color: var(--color-on-primary)\nFont: var(--font-label)', 'MED', 'TODO'),
      taskRow('4E-03', 'ProductCard component', 'File: src/components/ProductCard/ProductCard.jsx\nProps: { product }\nDisplay: product image (first color variant), product name (h3, primary color), price with EGP, category badge (label font, secondary color), color swatches (small circles for each color variant)\nCard style: var(--color-surface), radius-lg, no shadow — flat\nHover: subtle border color change to tertiary\nClick: navigates to /products/:id\nImage: aspect-ratio 3/4, object-fit cover, radius-md top corners', 'CRITICAL', 'TODO'),
      taskRow('4E-04', 'ProductGrid component', 'CSS Grid: repeat(auto-fill, minmax(260px, 1fr)), gap: var(--spacing-lg)\nReceives products array as prop\nShows "No products found" message if empty (styled, centered, primary color)', 'HIGH', 'TODO'),
      taskRow('4E-05', 'FilterSidebar component', 'Props: { filters, onChange }\nSections:\n1. Category checkboxes (fetched from /api/products/categories, shows count)\n2. Gender radio: All / Men / Women\n3. Price range: two number inputs (min, max)\n4. Reset Filters button (outline style, secondary color)\nAll changes call onChange(updatedFilters)\nMobile: slide-in drawer triggered by filter icon button', 'HIGH', 'TODO'),
      taskRow('4E-06', 'SizeTag component', 'Display size label (XS/S/M/L/XL/XXL)\nStyle: border 1px secondary, padding 4px 10px, radius-sm, label font\nIf stock=0: strikethrough, opacity 0.4', 'MED', 'TODO'),
      taskRow('4E-07', 'LoadingSpinner component', 'Simple CSS animation spinner\nPrimary color border, tertiary color top border\nCentered with min-height:200px wrapper', 'HIGH', 'TODO'),
      taskRow('4E-08', 'TryOnBanner component', 'Full-width banner with text "Try Before You Buy — AI Virtual Try-On"\nBackground: var(--color-primary); color: var(--color-on-primary)\nOne button (tertiary pink): "Launch Try-On Tool" → opens client-tryon URL in new tab\nPadding: var(--spacing-lg)', 'HIGH', 'TODO'),
    ]),
    heading2('4F. Pages (client-store)'),
    sectionTable([
      taskRow('4F-01', 'HomePage', 'File: src/pages/Home/HomePage.jsx\nSections:\n1. Hero: large headline (display font, primary color), subtext (body), one pink button "Browse Collection" → scrolls to featured\n2. Featured Products: heading "Featured Pieces", ProductGrid with isFeatured products (limit 8)\n3. Category Cards: horizontal scroll row, one card per category, clicking filters ProductsPage\n4. TryOnBanner\nNo sidebar on homepage', 'HIGH', 'TODO'),
      taskRow('4F-02', 'ProductsPage', 'File: src/pages/Products/ProductsPage.jsx\nLayout: sidebar left (FilterSidebar, 280px) + main right (ProductGrid)\nFetch products from API with current filter state\nPagination: prev/next buttons, page info "Page X of Y"\nURL reflects filters: update query params on filter change (useSearchParams)\nLoading state shows LoadingSpinner', 'CRITICAL', 'TODO'),
      taskRow('4F-03', 'ProductDetailPage', 'File: src/pages/ProductDetail/ProductDetailPage.jsx\nLayout:\nLeft: image gallery — main image (large, 3:4 ratio) + thumbnail row below for each color variant\nRight:\n  Product name (h1)\n  Price (large, primary)\n  Category + Gender badges\n  Color selector: click color swatch → updates main image\n  Size selector: row of SizeTags (disabled if stock=0)\n  Full description\n  Tags as pills (label font, secondary color)\n  "Try This On →" button (pink, full-width) → opens try-on tool in new tab with ?productId={id} pre-filled\nBreadcrumb: Home > Products > {name}', 'CRITICAL', 'TODO'),
      taskRow('4F-04', 'AdminLoginPage', 'File: src/pages/Admin/AdminLoginPage.jsx\nCentered card: username input, password input, "Login" button (pink)\nOn submit: call api/auth.login(), store JWT in localStorage("adminToken")\nRedirect to /admin on success\nShow error message below form on failure\nIf already logged in, redirect to /admin', 'CRITICAL', 'TODO'),
      taskRow('4F-05', 'AdminDashboard', 'File: src/pages/Admin/AdminDashboard.jsx\nProtected route\nSidebar nav: Dashboard, Products, Add Product\nStats cards:\n  Total Active Products\n  Total Categories\n  Featured Products count\nEach stat in a card (surface bg, primary color)\nTop right: "Logout" button (outline, secondary color)', 'HIGH', 'TODO'),
      taskRow('4F-06', 'AdminProductsPage', 'Protected route\nTable view of all products (including inactive)\nColumns: Image thumbnail, Name, Category, Price, Sizes, Featured toggle, Active toggle, Edit button\nSearch input to filter by name\nPagination: 20 per page\nDelete button (soft-delete with confirmation dialog)', 'CRITICAL', 'TODO'),
      taskRow('4F-07', 'AdminAddProductPage & AdminEditProductPage', 'Protected route. Same form component used for both.\nForm fields:\n  name (text, required)\n  category (select from enum list)\n  gender (radio: men/women/unisex)\n  description (textarea)\n  price (number, required)\n  currency (text, default EGP)\n  isFeatured (checkbox)\n  Colors section: dynamic — Add Color button, each color has: color name input, hex color picker, image upload (PNG only)\n  Sizes section: checkboxes for all size options, each checked size shows a stock number input\n  Tags: comma-separated input, displayed as editable pills\nSubmit: POST for new, PUT for edit\nValidation: client-side before submit, show inline errors', 'CRITICAL', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 5: TRY-ON TOOL FRONTEND ────────────────────────────────────────────
  
  const sec5 = [
    heading1('SECTION 5 — AI TRY-ON TOOL FRONTEND (client-tryon)'),
    noteBox('This is a KIOSK-STYLE tool. One user at a time. After session is done (image sent or dismissed), the tool resets completely to the initial screen for the next user. Never show previous user data.'),
    heading2('5A. Dependencies (client-tryon)'),
    sectionTable([
      taskRow('5A-01', 'Install client-tryon packages', 'npm install axios\nAll styling: CSS Modules\nSame Google Fonts as client-store (in index.html)', 'CRITICAL', 'TODO'),
    ]),
    heading2('5B. App State Machine'),
    sectionTable([
      taskRow('5B-01', 'Define TRYON_STATES enum', 'In src/constants/states.js, export:\nSTATE_WELCOME: "welcome" — initial screen with 2 buttons\nSTATE_MANUAL_PICK: "manual_pick" — user selects product\nSTATE_CAMERA: "camera" — camera view with pose guide\nSTATE_PROCESSING: "processing" — loading while Gemini works\nSTATE_RESULT: "result" — show generated image\nSTATE_SHARE: "share" — WhatsApp/Email input\nSTATE_AUTO_PICK: "auto_pick" — event type selection\nSTATE_AUTO_PROCESSING: "auto_processing" — auto mode AI working', 'CRITICAL', 'TODO'),
      taskRow('5B-02', 'App.jsx state management', 'Use useState for: currentState, sessionId, capturedPhoto (blob/dataURL), selectedProduct, generatedImageUrl, shareMode\nUse useEffect to clear state and call DELETE /api/tryon/:sessionId on component unmount or when user closes session\nAll child components receive state + setter props or use a shared context', 'CRITICAL', 'TODO'),
    ]),
    heading2('5C. Try-On Tool Screens'),
    sectionTable([
      taskRow('5C-01', 'WelcomeScreen', 'File: src/screens/WelcomeScreen/WelcomeScreen.jsx\nFull-screen layout (100vw, 100vh), background: var(--color-neutral)\nCenter content vertically and horizontally\nTop: Store logo/name\nHeadline: "Find Your Perfect Look" (display font size, primary color)\nSubtext: "AI-powered virtual try-on" (body, secondary color)\nTwo large cards side by side:\n  Card 1 (left): Icon (clothes hanger SVG), Title "Choose a Product", Description "Pick from our collection and see how it looks on you"\n  Card 2 (right): Icon (magic wand SVG), Title "Auto Style Me", Description "Tell us the occasion, we pick the perfect outfit for you"\nBoth cards: surface bg, primary border on hover (radius-lg)\nBottom strip: pink accent line (4px height, full width, tertiary color)', 'CRITICAL', 'TODO'),
      taskRow('5C-02', 'ProductPickerScreen (Manual Mode)', 'File: src/screens/ProductPickerScreen/ProductPickerScreen.jsx\nHeader: "Choose a Clothing Item" + back arrow button\nCategory filter row (horizontal scroll): buttons for each category, active = tertiary bg\nProduct grid: 3 columns, product cards with image, name, price\nEach card: click to select (shows check overlay in tertiary color)\nSelected product highlighted with tertiary border\n"Next: Take Photo →" button (pink, full-width, sticky bottom) — only enabled if product selected\nFetch products from /api/products with selected category filter', 'CRITICAL', 'TODO'),
      taskRow('5C-03', 'CameraScreen with Pose Guide', 'File: src/screens/CameraScreen/CameraScreen.jsx\nUse MediaDevices API: navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width:1280, height:720 } })\n<video> element shows live camera feed (fills screen)\nOverlay canvas: draw a lined figure (stick person outline) in primary color at 50% opacity — helps user position themselves\nFigure dimensions: centered, ~60% screen height, shows head circle + torso + arms at sides\nBottom bar: "Capture Photo" button (pink, large, rounded circle icon style)\nBack button top-left\nPermission denied state: show message "Camera permission required" with instruction', 'CRITICAL', 'TODO'),
      taskRow('5C-04', 'Pose Guide Drawing (Canvas Overlay)', 'Draw on canvas using CanvasRenderingContext2D:\nHead: circle, ~60px radius, stroke primary color, lineWidth:2\nNeck: vertical line from head bottom\nShoulder line: horizontal bar\nTorso: rectangle outline\nArms: two lines from shoulders, slightly angled outward, elbows + forearms\nHips: horizontal bar at torso bottom\nLegs: two lines from hips down, stopping before bottom of frame\nAll strokes: primary color (#1D3FA6), opacity 0.45, lineWidth 2\nCanvas position: absolute, top:0, left:0, same size as video element', 'CRITICAL', 'TODO'),
      taskRow('5C-05', 'ProcessingScreen', 'File: src/screens/ProcessingScreen/ProcessingScreen.jsx\nFull screen, centered\nLarge animated spinner (primary/tertiary color)\nText: "Generating your personalized look..."\nSub-text: "This usually takes 10–30 seconds"\nDo NOT show a cancel button — wait for API response', 'HIGH', 'TODO'),
      taskRow('5C-06', 'ResultScreen', 'File: src/screens/ResultScreen/ResultScreen.jsx\nLayout:\nLeft 60%: generated image (large, natural aspect ratio, radius-lg, centered)\nRight 40%: action panel\n  Title: "Your Look"\n  Selected product name + category\n  Two buttons:\n    "Send via WhatsApp" (pink, full-width)\n    "Send via Email" (outline, primary border)\n  "Try Another Look" link/button (secondary color, small) → goes back to WelcomeScreen and FULLY resets state\n  "Generate Again" link → same product, takes new photo (back to CameraScreen)\nMobile: stack vertically, image top, buttons below', 'CRITICAL', 'TODO'),
      taskRow('5C-07', 'AutoPickScreen (Auto Mode)', 'File: src/screens/AutoPickScreen/AutoPickScreen.jsx\nHeader: "What\'s the Occasion?"\nLarge icon + label cards for event types:\n  Casual Day, Wedding, Office, Party, Formal Event\nOne card selected at a time (tertiary highlight)\n"Next: Take Photo →" (pink) → goes to CameraScreen', 'HIGH', 'TODO'),
      taskRow('5C-08', 'ShareScreen (WhatsApp)', 'Shown as overlay/modal on ResultScreen\nInput: phone number field\n  Label: "Your WhatsApp number"\n  Placeholder: +20 XXXX XXXX (Egyptian format example)\n  Input type: tel, pattern: [0-9+]{10,15}\n  Validation: must start with + or digit, 10-15 chars\n"Send Now" button (pink)\nSuccess state: checkmark animation + "Image sent to WhatsApp!"\nError state: show error message + "Try Again" link', 'HIGH', 'TODO'),
      taskRow('5C-09', 'ShareScreen (Email)', 'Same overlay pattern as WhatsApp ShareScreen\nInput: email address (type=email)\n"Send to Email" button (pink)\nSuccess/error states same pattern', 'HIGH', 'TODO'),
    ]),
    heading2('5D. Camera & Image Capture Logic'),
    sectionTable([
      taskRow('5D-01', 'Image capture from video stream', 'On "Capture Photo" button click:\n1. Create offscreen <canvas> matching video dimensions\n2. ctx.drawImage(videoElement, 0, 0)\n3. canvas.toBlob(blob => ..., "image/jpeg", 0.9)\n4. Create FormData, append blob as "photo"\n5. POST to /api/tryon/start\n6. Store returned sessionId in state\n7. Transition to ProcessingScreen\n8. Stop camera stream (track.stop())', 'CRITICAL', 'TODO'),
      taskRow('5D-02', 'Handle camera errors gracefully', 'If getUserMedia throws NotAllowedError: show permission denied UI\nIf throws NotFoundError: show "No camera found" message\nBoth cases show back button to return to WelcomeScreen', 'HIGH', 'TODO'),
    ]),
    heading2('5E. URL Parameter Handling'),
    sectionTable([
      taskRow('5E-01', 'Pre-select product via URL param', 'On mount, read ?productId= from URL using new URLSearchParams(window.location.search)\nIf productId present: fetch product from /api/products/:id, set as selectedProduct in state, skip to CameraScreen (skip ProductPickerScreen)\nIf productId not present: show WelcomeScreen normally', 'HIGH', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 6: GEMINI API INTEGRATION ──────────────────────────────────────────
  
  const sec6 = [
    heading1('SECTION 6 — GEMINI API INTEGRATION'),
    noteBox('IMPORTANT: The Gemini API call is made SERVER-SIDE ONLY. The API key must NEVER be exposed to the frontend. The frontend calls your own Node.js backend, which calls Gemini.'),
    heading2('6A. Gemini Service'),
    sectionTable([
      taskRow('6A-01', 'Create /server/services/geminiService.js', 'Import: node-fetch (or axios)\nExport async function generateTryOnImage(userImagePath, productImagePath):\n  1. Read both files from disk as Buffer\n  2. Convert to base64 strings\n  3. Build Gemini API request body (see 6A-02)\n  4. POST to https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key={GEMINI_API_KEY}\n  5. Parse response: response.candidates[0].content.parts — find part where type is "image"\n  6. Decode base64 image data\n  7. Save to uploads/sessions/{sessionId}-result.jpg\n  8. Return the file path', 'CRITICAL', 'TODO'),
      taskRow('6A-02', 'Gemini request body structure', 'Request body:\n{\n  "contents": [{\n    "parts": [\n      { "inlineData": { "mimeType": "image/jpeg", "data": "{userImageBase64}" } },\n      { "inlineData": { "mimeType": "image/png", "data": "{productImageBase64}" } },\n      { "text": "You are given two images:\\nImage 1 — the main photo of a person.\\nImage 2 — a clothing item I want the person to wear.\\nYour task:\\nReplace ONLY the clothing item on the person in Image 1 (the jacket, t-shirt, or suit) with the clothing item shown in Image 2.\\nPreserve everything else with pixel-perfect accuracy:\\n* The person\'s face, skin tone, hair, and expression\\n* Body pose, position, and proportions\\n* Background, lighting, and shadows\\n* Any accessories (glasses, jewelry, bag, shoes, etc.)\\n* The overall mood and color grading of the original photo\\nThe replacement clothing must:\\n* Fit naturally on the person\'s body as if they are actually wearing it\\n* Follow the same lighting direction and shadow logic as the rest of the image\\n* Respect the fabric folds and wrinkles based on the pose\\n* Match the perspective and camera angle of the original photo\\nDo not change, enhance, or alter anything outside the clothing region. The final result should look like a seamless, photorealistic edit where only the garment has changed." }\n    ]\n  }],\n  "generationConfig": { "responseModalities": ["IMAGE", "TEXT"] }\n}', 'CRITICAL', 'TODO'),
      taskRow('6A-03', 'Install required packages for Gemini call', 'In /server: npm install node-fetch@2 (for CommonJS compatibility)\nOR use native fetch if Node.js version >= 18 (check with node --version)\nIf Node 18+: no additional install needed, use global fetch', 'HIGH', 'TODO'),
      taskRow('6A-04', 'Error handling for Gemini failures', 'Wrap Gemini call in try/catch\nIf API returns non-200: log full error body, update session status to "error", return { error: "Generation failed. Please try again." } to client\nIf response has no image part: same error handling\nTimeout: set 60-second timeout on the Gemini fetch call', 'HIGH', 'TODO'),
      taskRow('6A-05', 'Auto-generate product selection logic', 'For auto mode (/api/tryon/:sessionId/auto-generate):\nFetch all active products from DB\nSend a separate Gemini text-only call:\n  prompt: "Given this event type: {eventType}, and the following available clothing items: {JSON list of {id, name, category, gender}}, recommend 1 clothing item ID that would be most appropriate. Return ONLY the product ID as a plain string, nothing else."\nParse the returned text as productId\nFetch that product from DB\nProceed with normal try-on generation using that product image\nIf parse fails or product not found: pick first product alphabetically as fallback', 'HIGH', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 7: WHATSAPP & EMAIL INTEGRATION ────────────────────────────────────
  
  const sec7 = [
    heading1('SECTION 7 — WHATSAPP & EMAIL SHARING'),
    heading2('7A. WhatsApp Integration'),
    sectionTable([
      taskRow('7A-01', 'Create /server/services/whatsappService.js', 'Export async function sendImageToWhatsApp(phoneNumber, imagePath, sessionId):\nUse WhatsApp Business API via HTTP\nIf using Twilio:\n  POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json\n  Body: To=whatsapp:+{phoneNumber}, From=whatsapp:{TWILIO_NUMBER}, MediaUrl={full_image_url}\nIf using Meta WABA:\n  POST https://graph.facebook.com/v18.0/{PHONE_ID}/messages\n  Body: { messaging_product:"whatsapp", to:phoneNumber, type:"image", image:{ link:imageUrl, caption:"Your personalized outfit!" } }\nReturn { success: true } or throw error', 'HIGH', 'TODO'),
      taskRow('7A-02', 'Image URL for WhatsApp', 'WhatsApp API requires a PUBLIC URL for the image — it cannot accept local file paths.\nFor development: use ngrok to expose localhost:5000 and use the ngrok URL\nFor production: use the domain\'s public URL\nConstruct URL: process.env.PUBLIC_BASE_URL + "/" + imagePath\nAdd PUBLIC_BASE_URL to .env.example', 'HIGH', 'TODO'),
      taskRow('7A-03', 'Phone number validation', 'Validate phone number in route before calling service:\nStrip spaces and dashes\nMust start with + or digits\nLength 10–15 digits after stripping non-digits\nFor Egyptian numbers: accept 010XXXXXXXX, 011XXXXXXXX, 012XXXXXXXX, 015XXXXXXXX (prepend +2 if no country code)\nReturn 400 { error: "Invalid phone number" } if validation fails', 'HIGH', 'TODO'),
    ]),
    heading2('7B. Email Integration'),
    sectionTable([
      taskRow('7B-01', 'Create /server/services/emailService.js', 'Install: npm install nodemailer\nCreate transporter using SMTP env vars:\n  host: SMTP_HOST, port: SMTP_PORT, secure: true if port=465\n  auth: { user: SMTP_USER, pass: SMTP_PASS }\nExport async function sendImageByEmail(toEmail, imagePath):\n  Read image file as Buffer\n  Send mail with:\n    from: "Clothing Store <noreply@store.com>"\n    to: toEmail\n    subject: "Your Virtual Try-On Result"\n    html: "<p>Thank you for trying our virtual try-on feature!</p><p>Find your personalized outfit image attached.</p>"\n    attachments: [{ filename: "your-outfit.jpg", content: imageBuffer }]', 'HIGH', 'TODO'),
      taskRow('7B-02', 'Email validation', 'Validate email in route with regex: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/\nReturn 400 { error: "Invalid email address" } if fails', 'HIGH', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 8: ENVIRONMENT & DEPLOYMENT ────────────────────────────────────────
  
  const sec8 = [
    heading1('SECTION 8 — ENVIRONMENT VARIABLES & DEPLOYMENT CONFIG'),
    sectionTable([
      taskRow('8A-01', 'client-store .env', 'VITE_API_URL=http://localhost:5000\nVITE_TRYON_TOOL_URL=http://localhost:5174\nFor production: update these to actual deployed URLs', 'CRITICAL', 'TODO'),
      taskRow('8A-02', 'client-tryon .env', 'VITE_API_URL=http://localhost:5000\nVITE_STORE_URL=http://localhost:5173', 'CRITICAL', 'TODO'),
      taskRow('8A-03', 'server .env (full list)', 'MONGO_URI=mongodb://localhost:27017/clothing-store\nJWT_SECRET=<random 64-char string>\nGEMINI_API_KEY=<from Google AI Studio>\nPORT=5000\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=465\nSMTP_USER=<email>\nSMTP_PASS=<app password>\nPUBLIC_BASE_URL=http://localhost:5000 (ngrok in dev)\nCLIENT_STORE_URL=http://localhost:5173\nCLIENT_TRYON_URL=http://localhost:5174\nWHATSAPP_PROVIDER=twilio (or "meta")\nTWILIO_ACCOUNT_SID=<if using Twilio>\nTWILIO_AUTH_TOKEN=<if using Twilio>\nTWILIO_WHATSAPP_NUMBER=+14155238886 (Twilio sandbox)', 'CRITICAL', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 9: ACCESSIBILITY & RESPONSIVE ──────────────────────────────────────
  
  const sec9 = [
    heading1('SECTION 9 — RESPONSIVE DESIGN & ACCESSIBILITY'),
    para('All breakpoints use CSS Modules with CSS custom property variables. No external breakpoint libraries.'),
    sectionTable([
      taskRow('9A-01', 'Breakpoint definitions', 'In global.module.css, define as CSS custom properties:\n--bp-mobile: 480px\n--bp-tablet: 768px\n--bp-desktop: 1200px\nUse @media (max-width: 768px) etc. inside each component\'s CSS module file', 'HIGH', 'TODO'),
      taskRow('9A-02', 'client-store responsive', 'ProductGrid: 3 cols desktop → 2 cols tablet → 1 col mobile\nFilterSidebar: side panel desktop → bottom drawer mobile (toggle with filter button)\nNavbar: full links desktop → hamburger mobile\nProductDetail: two-column desktop → single column mobile', 'HIGH', 'TODO'),
      taskRow('9A-03', 'client-tryon responsive', 'All screens: designed mobile-first (portrait phone)\nCameraScreen: camera should fill full viewport\nResultScreen: image top, buttons below on mobile\nAll touch targets: minimum 44×44px', 'HIGH', 'TODO'),
      taskRow('9A-04', 'Accessibility basics', 'All images have meaningful alt text\nAll interactive elements have aria-label if no visible text\nFocus outlines: 2px solid var(--color-tertiary) on :focus-visible\nForm inputs have associated <label> elements\nError messages have role="alert"\nColor contrast: primary (#1D3FA6) on surface (#FAF6EC) passes WCAG AA', 'MED', 'TODO'),
    ]),
    divider(),
  ];
  
  // ─── SEC 10: FINAL CHECKS ───────────────────────────────────────────────────
  
  const sec10 = [
    heading1('SECTION 10 — FINAL INTEGRATION CHECKLIST'),
    noteBox('Run this checklist after all sections above are complete. Each item should be verified manually.'),
    heading2('Store (client-store) Checks'),
    numbered('Homepage loads: featured products appear, hero visible'),
    numbered('Products page: filter by category works, filter by gender works, price filter works'),
    numbered('Product detail: color switcher changes main image, size tags show out-of-stock correctly'),
    numbered('"Try This On" button opens client-tryon in new tab with ?productId= param'),
    numbered('Admin login works and protects all /admin routes'),
    numbered('Admin can create product with image upload'),
    numbered('Admin can edit and soft-delete product'),
    numbered('Featured toggle works and reflects on homepage'),
    heading2('Try-On Tool (client-tryon) Checks'),
    numbered('Welcome screen shows both mode buttons'),
    numbered('Manual mode: product picker shows products from API'),
    numbered('Camera screen: live video appears, pose guide overlay drawn correctly'),
    numbered('Photo capture: photo sent to backend, sessionId returned'),
    numbered('Manual generate: Gemini API called, result image returned and displayed'),
    numbered('Auto mode: event type selection → camera → processing → result'),
    numbered('WhatsApp send: phone number validation works, API called'),
    numbered('Email send: email validation works, nodemailer sends'),
    numbered('"Try Another Look" completely resets all state'),
    numbered('URL param ?productId pre-selects product and skips picker'),
    numbered('Session cleanup: old uploaded files deleted on session close'),
    heading2('Cross-App Checks'),
    numbered('CORS: client-store can fetch from Node.js server'),
    numbered('CORS: client-tryon can fetch from Node.js server'),
    numbered('Both clients show loading states while fetching'),
    numbered('Server error responses shown to user gracefully (no raw JSON exposed)'),
    numbered('All .env variables documented in .env.example with descriptions'),
    numbered('No API keys in any committed file'),
    divider(),
  ];
  
  // ─── BUILD DOCUMENT ───────────────────────────────────────────────────────────
  
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 20 } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Arial', color: COLORS.primary },
          paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: COLORS.secondary },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }, {
            level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 15840, height: 12240 }, // Landscape Letter
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
          orientation: 'landscape',
        },
      },
      children: [
        ...titleSection,
        ...legendSection,
        ...sec0,
        ...sec1,
        ...sec2,
        ...sec3,
        ...sec4,
        ...sec5,
        ...sec6,
        ...sec7,
        ...sec8,
        ...sec9,
        ...sec10,
      ],
    }],
  });
  
  Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/mnt/user-data/outputs/clothing_platform_tasks.docx', buffer);
    console.log('Done! File written.');
  });