import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM admins WHERE email=? AND status='active'",
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const admin = rows[0];
  const match = await bcrypt.compare(password, admin.password);

  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      role: admin.role
    }
  });
};
