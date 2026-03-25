import { db } from './config/db.js';

try {
  const [rows] = await db.query('SELECT 1');
  console.log('✅ DB connected successfully');
  process.exit(0);
} catch (err) {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
}