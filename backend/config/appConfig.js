// config/appConfig.js
// ============================================================
// MASTER CONFIG LOADER
// Import this file anywhere in the app to get current settings:
//   const config = require('./config/appConfig');
//   if (config.input.sanitizeInputs) { ... }
// ============================================================

const path = require('path');
const mode = process.env.APP_MODE;

if (!mode || !['vulnerable', 'secure'].includes(mode)) {
  console.error(`❌ Invalid APP_MODE: "${mode}". Must be "vulnerable" or "secure".`);
  process.exit(1);
}

const config = require(`./modes/${mode}`);
console.log(`⚙️  App running in [${mode.toUpperCase()}] mode`);

module.exports = config;