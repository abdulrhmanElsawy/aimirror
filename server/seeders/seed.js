/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const categories = [
  ...Array(5).fill('jacket'),
  ...Array(5).fill('tshirt'),
  ...Array(5).fill('trousers'),
  ...Array(3).fill('dress'),
  ...Array(3).fill('suit'),
];

const categoryImagePaths = {
  jacket: '/uploads/products/real-jacket.png',
  tshirt: '/uploads/products/real-tshirt.png',
  trousers: '/uploads/products/real-trousers.png',
  dress: '/uploads/products/real-dress.png',
  suit: '/uploads/products/real-dress-alt.png',
};

const categoryAltImagePaths = {
  jacket: '/uploads/products/real-jacket.png',
  tshirt: '/uploads/products/real-tshirt.png',
  trousers: '/uploads/products/real-trousers.png',
  dress: '/uploads/products/real-dress-alt.png',
  suit: '/uploads/products/real-dress.png',
};

async function ensureCategoryImages(productDir) {
  for (const cat of [...new Set(categories)]) {
    const placeholderPath = path.join(productDir, `placeholder-${cat}.png`);
    if (fs.existsSync(placeholderPath)) continue;
    fs.writeFileSync(placeholderPath, PNG_1x1);
  }
}

async function run() {
  await connectDB();

  const productDir = path.join(__dirname, '..', 'uploads', 'products');
  if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });
  await ensureCategoryImages(productDir);

  await Product.deleteMany({});

  const sizes = ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
    size,
    stock: Math.floor(Math.random() * 20),
  }));

  const docs = categories.map((category, i) => {
    const price = 100 + Math.floor(Math.random() * 1900);
    return {
      name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
      category,
      gender: ['men', 'women', 'unisex'][i % 3],
      description: `Sample ${category} product for development.`,
      price,
      currency: 'EGP',
      images: [
        {
          color: 'Default',
          hex: '#1D3FA6',
          imagePath:
            categoryImagePaths[category] ||
            `/uploads/products/placeholder-${category}.png`,
        },
        {
          color: 'Alt',
          hex: '#6680C2',
          imagePath:
            categoryAltImagePaths[category] ||
            `/uploads/products/placeholder-${category}.png`,
        },
      ],
      sizes,
      tags: [category, 'sample'],
      isFeatured: i < 8,
      isActive: true,
    };
  });

  await Product.insertMany(docs);
  console.log(`Seeded ${docs.length} products`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
