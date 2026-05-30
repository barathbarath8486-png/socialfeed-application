const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ─── Helper: Generate JWT ─────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post(
  "/signup",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3–20 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, email, password } = req.body;

    try {
      // Check for existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        const field = existingUser.email === email ? "Email" : "Username";
        return res.status(409).json({ message: `${field} is already taken` });
      }

      // Create new user
      const user = await User.create({ username, email, password });

      res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Server error during signup" });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Get currently authenticated user's profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
