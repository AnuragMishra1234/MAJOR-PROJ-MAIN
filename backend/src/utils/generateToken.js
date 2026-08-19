import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for a given user ID.
 *
 * @param {string} id  — MongoDB ObjectId of the user
 * @returns {string}   — Signed JWT string
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
