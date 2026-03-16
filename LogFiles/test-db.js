const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

console.log('Testing MongoDB connection...');
console.log('DATABASEURL:', process.env.DATABASEURL ? process.env.DATABASEURL.substring(0, 50) + '...' : 'NOT SET');

mongoose.connect(process.env.DATABASEURL, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ Database connected successfully!');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Database connection failed:');
  console.error('Error:', err.message);
  console.error('Code:', err.code);
  process.exit(1);
});
