// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const oracleRoute = require('./oracleRoute');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: ['http://localhost:5500', 'http://127.0.0.1:5500'] }));

app.use('/', oracleRoute);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Oracle server running on port ${PORT}`));
