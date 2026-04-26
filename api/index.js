const app = require('./server');

// IMPORTANT: wrap Express for Vercel serverless
module.exports = (req, res) => {
  return app(req, res);
};
