const jwt = require('jsonwebtoken');
const db = require('../index.js');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'THe email address or password isnt true' });
    }

    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'The email address or password isnt true' });
    }

    const payload = {
      id: user.id,
      role: user.role,
      company_id: user.company_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: 'Success signing', token });
  } catch (error) {
    next(error); 
  }
};

module.exports = { login };