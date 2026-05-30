import React, { useState, useRef } from "react";
import {
  Card, CardContent, Box, Avatar, TextField, Button, IconButton,
  CircularProgress, Tooltip, Chip,
} from "@mui/material";
import { PhotoCamera, Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import { createPost } from "../api";
import { useAuth } from "../context/AuthContext";

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);       // File object
  const [preview, setPreview] = useState(null);   // Data URL for preview
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !image) {
      toast.error("Write something or add an image to post");
      return;
    }

    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    if (image) formData.append("image", image);

    setLoading(true);
    try {
      const res = await createPost(formData);
      onPostCreated(res.data); // pass new post up to parent
      setText("");
      removeImage();
      toast.success("Post created! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2.5, borderRadius: 3 }}>
      <CardContent sx={{ pb: "16px !important" }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          {/* User avatar */}
          <Avatar sx={{ bgcolor: "primary.main", fontWeight: 700, width: 40, height: 40 }}>
            {user?.username[0].toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            {/* Text input */}
            <TextField
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              placeholder={`What's on your mind, ${user?.username}?`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              inputProps={{ maxLength: 1000 }}
              variant="standard"
              sx={{
                "& .MuiInput-underline:before": { borderBottomColor: "#e5e7eb" },
                mb: 1.5,
              }}
            />

            {/* Image preview */}
            {preview && (
              <Box sx={{ position: "relative", display: "inline-block", mb: 1.5 }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, display: "block" }}
                />
                <IconButton
                  size="small"
                  onClick={removeImage}
                  sx={{
                    position: "absolute", top: 4, right: 4,
                    bgcolor: "rgba(0,0,0,0.55)", color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Actions row */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* Image upload button */}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <Tooltip title="Add photo">
                  <IconButton size="small" onClick={() => fileInputRef.current.click()} color="primary">
                    <PhotoCamera />
                  </IconButton>
                </Tooltip>

                {/* Character count */}
                {text.length > 800 && (
                  <Chip
                    label={`${1000 - text.length} left`}
                    size="small"
                    color={text.length > 950 ? "error" : "warning"}
                    variant="outlined"
                  />
                )}
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || (!text.trim() && !image)}
                sx={{ borderRadius: 99, px: 3 }}
                startIcon={loading && <CircularProgress size={16} color="inherit" />}
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
