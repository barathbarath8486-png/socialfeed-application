const mongoose = require("mongoose");

// ─── Comment Sub-Schema ───────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    // Username of commenter (denormalized for fast reads)
    username: {
      type: String,
      required: true,
    },
    // Reference to user who commented
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
      trim: true,
    },
  },
  { timestamps: true }
);

// ─── Post Schema ──────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    // Author reference
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Denormalized username for fast feed rendering
    authorUsername: {
      type: String,
      required: true,
    },
    // Post content (text is optional if image exists)
    text: {
      type: String,
      maxlength: [1000, "Post text cannot exceed 1000 characters"],
      trim: true,
      default: "",
    },
    // Image URL from Cloudinary (optional if text exists)
    imageUrl: {
      type: String,
      default: "",
    },
    // Cloudinary public_id for deletion
    imagePublicId: {
      type: String,
      default: "",
    },
    // Array of user IDs who liked the post
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Array of usernames who liked (for quick display)
    likedByUsernames: [String],
    // Embedded comments
    comments: [commentSchema],
  },
  { timestamps: true }
);

// ─── Virtual: likes count ─────────────────────────────────────────────────────
postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

// ─── Virtual: comments count ──────────────────────────────────────────────────
postSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

// Validate: at least text or image must be provided
postSchema.pre("save", function (next) {
  if (!this.text && !this.imageUrl) {
    return next(new Error("Post must have either text or an image"));
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
