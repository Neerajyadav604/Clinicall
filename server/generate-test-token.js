const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// JWT Secret from .env
const JWT_SECRET = 'v8Y@3jK!zR^9q#H)1LpXf*5nS%gE2mB&dFutN';

// Create a fake user ID (ObjectId)
const userId = new mongoose.Types.ObjectId();

// Generate a JWT token
const token = jwt.sign(
  { _id: userId.toString(), email: 'test@clinicall.com' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('✅ JWT Token Generated:');
console.log(token);
console.log('\nUser ID:', userId.toString());
