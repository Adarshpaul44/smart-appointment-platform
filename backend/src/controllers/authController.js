/**
 * Authentication Controller
 * 
 * Handles user registration, login with bcrypt password verification,
 * and JWT session token generation.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'adarsh_college_project_secret_2026_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
  /**
   * User Registration
   * Route: POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { name, email, password, phone, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email, and password.'
        });
      }

      // Basic email regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      // Check if user already exists
      const existing = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      // Hash password using bcrypt
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Default role is 'customer'; only allow 'admin' if explicitly specified or in dev
      const userRole = role === 'admin' ? 'admin' : 'customer';

      const insertResult = await db.query(
        `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role, phone, created_at`,
        [name.trim(), email.toLowerCase().trim(), password_hash, userRole, phone || null]
      );

      const newUser = insertResult.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: {
          user: newUser,
          token
        }
      });
    } catch (err) {
      console.error('[AuthController.register] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration. Please try again.',
        error: err.message
      });
    }
  }

  /**
   * User Login
   * Route: POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.'
        });
      }

      const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const user = result.rows[0];

      // Verify bcrypt password hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at
      };

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        data: {
          user: safeUser,
          token
        }
      });
    } catch (err) {
      console.error('[AuthController.login] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during login. Please try again.',
        error: err.message
      });
    }
  }

  /**
   * Get Current Authenticated User Profile
   * Route: GET /api/auth/me
   */
  static async getProfile(req, res) {
    try {
      const result = await db.query(
        'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (err) {
      console.error('[AuthController.getProfile] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching profile.',
        error: err.message
      });
    }
  }
}

module.exports = AuthController;
