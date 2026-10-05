/**
 * Authentication and Role-Based Authorization Middleware
 * 
 * Verifies JWT tokens and enforces access control:
 * - authenticateToken: validates incoming Bearer tokens
 * - requireAdmin: ensures user possesses 'admin' privileges
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'adarsh_college_project_secret_2026_dev';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token required.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrator privileges required.'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
