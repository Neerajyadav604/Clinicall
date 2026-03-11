const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

// ensure required signing secrets are present early to avoid runtime surprises
const { JWT_SECRET, REFRESH_TOKEN_SECRET } = process.env;
if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  // eslint-disable-next-line no-console
  console.error('FATAL: JWT_SECRET and/or REFRESH_TOKEN_SECRET not set in environment');
  // throw synchronously so application initialization fails fast
  throw new Error('Missing JWT configuration; check environment variables');
}

exports.signAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '15m' });
};

exports.signRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
  const rt = await RefreshToken.create({ user: userId, token, expiresAt });
  return rt;
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.verifyRefreshToken = async (token) => {
  const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const stored = await RefreshToken.findOne({ token, revoked: false });
  if (!stored) throw new Error('Refresh token not found or revoked');
  if (stored.expiresAt < Date.now()) throw new Error('Refresh token expired');
  return payload;
};

exports.revokeRefreshToken = async (token) => {
  await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
};
