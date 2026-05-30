import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, CircularProgress, Container, Alert,
} from "@mui/material";
import { getPosts } from "../api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";

const PAGE_SIZE = 10;

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const bottomRef = useRef(null);

  // ─── Fetch posts ──────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await getPosts(pageNum, PAGE_SIZE);
      const { posts: newPosts, hasNextPage: next } = res.data;

      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
      setHasNextPage(next);
      setPage(pageNum);
    } catch (err) {
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // ─── Infinite scroll via IntersectionObserver ─────────────────────────────
  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          fetchPosts(page + 1, true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, page, fetchPosts]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  // Add newly created post to the top of the feed
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Remove deleted post from feed
  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Create post box */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Feed */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography fontSize={40}>📝</Typography>
          <Typography variant="h6" mt={1} color="text.secondary">
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Be the first to share something!
          </Typography>
        </Box>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handleDeletePost}
            />
          ))}

          {/* Infinite scroll trigger element */}
          <Box ref={bottomRef} sx={{ py: 2, textAlign: "center" }}>
            {loadingMore && <CircularProgress size={28} />}
            {!hasNextPage && posts.length > 0 && (
              <Typography variant="caption" color="text.disabled">
                You've seen all posts ✨
              </Typography>
            )}
          </Box>
        </>
      )}
    </Container>
  );
}
