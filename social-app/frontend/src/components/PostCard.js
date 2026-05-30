import React, { useState } from "react";
import {
  Card, CardContent, CardMedia, CardActions, Box, Avatar, Typography,
  IconButton, Button, TextField, Divider, Collapse, Tooltip, 
  CircularProgress, Menu, MenuItem, ListItemIcon,
} from "@mui/material";
import {
  Favorite, FavoriteBorder, ChatBubbleOutline, Send, MoreVert,
  Delete,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { format } from "timeago.js";
import { likePost, addComment, deletePost, deleteComment } from "../api";
import { useAuth } from "../context/AuthContext";

// ─── Single Comment Row ───────────────────────────────────────────────────────
function CommentRow({ comment, postId, onDelete, currentUser }) {
  const isOwner = currentUser?.username === comment.username;

  return (
    <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>
      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "#4f46e5" }}>
        {comment.username[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, bgcolor: "#f3f4f6", borderRadius: 2, px: 1.5, py: 0.8 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" fontWeight={700}>{comment.username}</Typography>
          {isOwner && (
            <IconButton
              size="small"
              onClick={() => onDelete(postId, comment._id)}
              sx={{ p: 0.2, color: "text.disabled" }}
            >
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" sx={{ color: "text.primary", mt: 0.2 }}>
          {comment.text}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {format(comment.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();

  // Local state derived from post prop
  const [liked, setLiked] = useState(
    post.likes?.some((id) => id === user?._id)
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [likedUsernames, setLikedUsernames] = useState(post.likedByUsernames || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Kebab menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isOwner = user?.username === post.authorUsername;

  // ─── Like ───────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user) return toast.error("Login to like posts");
    setLikeLoading(true);
    try {
      const res = await likePost(post._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes);
      setLikedUsernames(res.data.likedByUsernames);
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  // ─── Comment Submit ─────────────────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) return toast.error("Login to comment");

    setCommentLoading(true);
    try {
      const res = await addComment(post._id, commentText.trim());
      setComments((prev) => [...prev, res.data.comment]);
      setCommentText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // ─── Delete Comment ─────────────────────────────────────────────────────────
  const handleDeleteComment = async (postId, commentId) => {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  // ─── Delete Post ────────────────────────────────────────────────────────────
  const handleDeletePost = async () => {
    setMenuAnchor(null);
    try {
      await deletePost(post._id);
      onDelete(post._id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 3 }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Post header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "primary.main", fontWeight: 700 }}>
              {post.authorUsername[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={14}>
                {post.authorUsername}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(post.createdAt)}
              </Typography>
            </Box>
          </Box>

          {/* Kebab menu (only for owner) */}
          {isOwner && (
            <>
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVert fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}
              >
                <MenuItem onClick={handleDeletePost} sx={{ color: "error.main" }}>
                  <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                  Delete post
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        {/* Post text */}
        {post.text && (
          <Typography variant="body1" sx={{ mt: 1.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {post.text}
          </Typography>
        )}
      </CardContent>

      {/* Post image */}
      {post.imageUrl && (
        <CardMedia
          component="img"
          image={post.imageUrl}
          alt="post"
          sx={{ maxHeight: 480, objectFit: "cover" }}
        />
      )}

      {/* ─── Stats Row ─────────────────────────────────────────────────────── */}
      {(likesCount > 0 || comments.length > 0) && (
        <Box sx={{ px: 2, pt: 1, display: "flex", justifyContent: "space-between" }}>
          {likesCount > 0 && (
            <Tooltip title={likedUsernames.slice(0, 5).join(", ") + (likedUsernames.length > 5 ? "..." : "")}>
              <Typography variant="caption" color="text.secondary" sx={{ cursor: "default" }}>
                ❤️ {likesCount} {likesCount === 1 ? "like" : "likes"}
              </Typography>
            </Tooltip>
          )}
          {comments.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: "pointer", ml: "auto" }}
              onClick={() => setShowComments((s) => !s)}
            >
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ mx: 2, mt: 0.5 }} />

      {/* ─── Action Buttons ─────────────────────────────────────────────────── */}
      <CardActions sx={{ px: 1, py: 0.5 }}>
        <Button
          startIcon={
            likeLoading
              ? <CircularProgress size={16} />
              : liked
              ? <Favorite color="error" />
              : <FavoriteBorder />
          }
          onClick={handleLike}
          disabled={likeLoading}
          sx={{ color: liked ? "error.main" : "text.secondary", flex: 1, borderRadius: 2 }}
          size="small"
        >
          Like
        </Button>
        <Button
          startIcon={<ChatBubbleOutline />}
          onClick={() => setShowComments((s) => !s)}
          sx={{ color: "text.secondary", flex: 1, borderRadius: 2 }}
          size="small"
        >
          Comment
        </Button>
      </CardActions>

      {/* ─── Comments Section ────────────────────────────────────────────────── */}
      <Collapse in={showComments}>
        <Divider sx={{ mx: 2 }} />
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          {/* Existing comments */}
          {comments.length === 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1 }}>
              No comments yet. Be the first!
            </Typography>
          )}
          {comments.map((comment) => (
            <CommentRow
              key={comment._id}
              comment={comment}
              postId={post._id}
              onDelete={handleDeleteComment}
              currentUser={user}
            />
          ))}

          {/* Comment input */}
          <Box
            component="form"
            onSubmit={handleComment}
            sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center" }}
          >
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.main" }}>
              {user?.username[0].toUpperCase()}
            </Avatar>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 99 } }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment(e);
                }
              }}
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={!commentText.trim() || commentLoading}
              size="small"
            >
              {commentLoading ? <CircularProgress size={18} /> : <Send />}
            </IconButton>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
}
