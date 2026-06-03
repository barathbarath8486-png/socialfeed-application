const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ─── Create uploads folder if it doesn't exist ────────────────────────────────
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Storage Configuration ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  // Set destination folder
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // Set unique filename using timestamp
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// ─── File Filter (images only) ────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // accept file
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// ─── Multer Upload Instance ───────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = { upload };