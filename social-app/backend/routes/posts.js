const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");
const { upload} = require("../middleware/upload");
const fs = require("fs");
// ─── GET /api/posts ───────────────────────────────────────────────────────────
// Get all posts (public feed) with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;    // current page
    const limit = parseInt(req.query.limit) || 10; // posts per page
    const skip = (page - 1) * limit;

    // Fetch posts sorted by newest first
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // lean() for faster reads (plain JS objects)

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
// Get single post by ID
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
// Create a new post (auth required)
router.post(
  "/",
  protect,
  upload.single("image"), // handle single image upload
  async (req, res) => {
    const { text } = req.body;
    const imageUrl = req.file?.path || "";        // Cloudinary URL
    const imagePublicId = req.file?.filename || ""; // Cloudinary public_id

    // Validate: at least text or image required
    if (!text?.trim() && !imageUrl) {
      return res
        .status(400)
        .json({ message: "Post must have text or an image" });
    }

    try {
      const post = await Post.create({
        author: req.user._id,
        authorUsername: req.user.username,
        text: text?.trim() || "",
        imageUrl,
        imagePublicId,
        likes: [],
        likedByUsernames: [],
        comments: [],
      });

      res.status(201).json(post);
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({ message: "Failed to create post" });
    }
  }
);

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
// Delete a post (only by author)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only the author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete image from Cloudinary if exists
   // Delete local image file if exists
    if (post.imageUrl) {
      const filePath = post.imageUrl.replace("http://localhost:5000/", "");
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
// Toggle like on a post (auth required)
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
      // Unlike: remove user ID and username
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      post.likedByUsernames = post.likedByUsernames.filter((u) => u !== username);
    } else {
      // Like: add user ID and username
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
// Add a comment to a post (auth required)
router.post(
  "/:id/comment",
  protect,
  [body("text").trim().notEmpty().withMessage("Comment cannot be empty")
    .isLength({ max: 500 }).withMessage("Comment too long (max 500 chars)")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      const newComment = {
        username: req.user.username,
        user: req.user._id,
        text: req.body.text,
      };

      post.comments.push(newComment);
      await post.save();

      // Return the newly added comment (last in array)
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
// Delete a comment (only by comment author)
router.delete("/:postId/comment/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only comment author can delete
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
