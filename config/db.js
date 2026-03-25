// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';

// dotenv.config();

// export const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME
// });

import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Only add SSL if the CA file is provided
if (process.env.DB_SSL_CA) {
  dbConfig.ssl = {
    ca: fs.readFileSync(process.env.DB_SSL_CA),
    cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined,
    key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined,
  };
}

export const db = mysql.createPool(dbConfig);

// Optional test function
export async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('DB connected successfully!');
    connection.release();
  } catch (err) {
    console.error('DB connection error:', err);
  }
}
