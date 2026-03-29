const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { username, email, password  } = req.body;

  // Validate fields presence (brief example)
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email and password' });
  }

  // Check if username or email already exists
  const existingUser = await User.findOne({ 
    $or: [{ username }, { email }]
  });
  if (existingUser) {
    return res.status(400).json({ message: 'Username or email already in use' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashed  });
  await user.save();
  res.json({ message: 'Registered' });
};


exports.login = async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' is username or email

  // Find user by email OR username
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, process.env.JWT_SECRET);
  res.json({ token });
};


