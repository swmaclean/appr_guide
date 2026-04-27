const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ ok: true, message: 'API is working' });
});

module.exports = app;
