import axios from "axios";

// Base axios instance — reads API URL from environment variable
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth Endpoints ────────────────────────────────────────────────────────────
export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

// ─── Post Endpoints ────────────────────────────────────────────────────────────
export const getPosts = (page = 1, limit = 10) =>
  API.get(`/posts?page=${page}&limit=${limit}`);

export const createPost = (formData) =>
  API.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deletePost = (postId) => API.delete(`/posts/${postId}`);

export const likePost = (postId) => API.put(`/posts/${postId}/like`);

export const addComment = (postId, text) =>
  API.post(`/posts/${postId}/comment`, { text });

export const deleteComment = (postId, commentId) =>
  API.delete(`/posts/${postId}/comment/${commentId}`);

export default API;
