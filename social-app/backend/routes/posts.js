const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

// ─── GET /api/posts ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasNextPage: page * limit < total,
    });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────
router.post("/", protect, upload.single("image"), async (req, res) => {
  const { text } = req.body;

  // Build image URL pointing to our local uploads folder
  const imageUrl = req.file
    ? `http://localhost:5000/uploads/${req.file.filename}`
    : "";

  if (!text?.trim() && !imageUrl) {
    return res.status(400).json({ message: "Post must have text or an image" });
  }

  try {
    const post = await Post.create({
      author: req.user._id,
      authorUsername: req.user.username,
      text: text?.trim() || "",
      imageUrl,
      likes: [],
      likedByUsernames: [],
      comments: [],
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete local image file if exists
    if (post.imageUrl) {
      const filename = path.basename(post.imageUrl);
      const filePath = path.join("uploads", filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

// ─── PUT /api/posts/:id/like ──────────────────────────────────────────────────
router.put("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const username = req.user.username;
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      post.likedByUsernames = post.likedByUsernames.filter((u) => u !== username);
    } else {
      post.likes.push(userId);
      post.likedByUsernames.push(username);
    }

    await post.save();

    res.json({
      likes: post.likes.length,
      likedByUsernames: post.likedByUsernames,
      liked: !alreadyLiked,
    });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Failed to toggle like" });
  }
});

// ─── POST /api/posts/:id/comment ──────────────────────────────────────────────
router.post(
  "/:id/comment",
  protect,
  [
    body("text")
      .trim()
      .notEmpty()
      .withMessage("Comment cannot be empty")
      .isLength({ max: 500 })
      .withMessage("Comment too long (max 500 chars)"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      post.comments.push({
        username: req.user.username,
        user: req.user._id,
        text: req.body.text,
      });

      await post.save();

      const addedComment = post.comments[post.comments.length - 1];
      res.status(201).json({
        comment: addedComment,
        commentsCount: post.comments.length,
      });
    } catch (err) {
      console.error("Comment error:", err);
      res.status(500).json({ message: "Failed to add comment" });
    }
  }
);

// ─── DELETE /api/posts/:postId/comment/:commentId ─────────────────────────────
router.delete("/:postId/comment/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    res.json({ message: "Comment deleted", commentsCount: post.comments.length });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

module.exports = router;