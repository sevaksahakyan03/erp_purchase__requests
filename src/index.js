const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('Succesful connection with db'))
  .catch((err) => console.error('Connection error', err.stack));

module.exports = {
  query: (text, params) => pool.query(text, params),
  
  getClient: () => pool.connect(), 
};

