import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, InputAdornment, IconButton, Link as MuiLink,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { signup } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.username.trim()) {
      e.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      e.username = "3–20 chars, letters/numbers/underscores only";
    }
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await signup(form);
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.username}! 🎉`);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 400, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>Create an account</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Join SocialFeed and start sharing
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              error={!!errors.username}
              helperText={errors.username || "Letters, numbers, and underscores only"}
              sx={{ mb: 2 }}
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={!!errors.password}
              helperText={errors.password || "Minimum 6 characters"}
              sx={{ mb: 3 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass((s) => !s)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ borderRadius: 99, py: 1.4 }}
              startIcon={loading && <CircularProgress size={18} color="inherit" />}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" mt={2.5} color="text.secondary">
            Already have an account?{" "}
            <MuiLink component={Link} to="/login" fontWeight={600}>
              Login
            </MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
