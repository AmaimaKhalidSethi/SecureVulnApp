const mongoSanitize = require('express-mongo-sanitize');

const sanitize = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.log(`⚠️  [SANITIZE] Operator stripped from key: ${key}`);
  },
});

module.exports = sanitize;