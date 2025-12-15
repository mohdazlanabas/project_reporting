const { Pool } = require('pg');

// Shared Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres client error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
