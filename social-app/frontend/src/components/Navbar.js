import React from "react";
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Tooltip,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

// Simple logo/brand icon
const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#4f46e5" />
    <path d="M8 10h12M8 14h8M8 18h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "white",
        borderBottom: "1px solid #e5e7eb",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ maxWidth: 680, width: "100%", mx: "auto", px: 2 }}>
        {/* Brand */}
        <Box
          component={Link}
          to="/"
          sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", color: "inherit", flexGrow: 1 }}
        >
          <Logo />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
            SocialFeed
          </Typography>
        </Box>

        {/* Nav actions */}
        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title={user.username}>
              <Avatar
                sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14, fontWeight: 700, cursor: "default" }}
              >
                {user.username[0].toUpperCase()}
              </Avatar>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              sx={{ borderRadius: 99 }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button component={Link} to="/login" variant="text" size="small">
              Login
            </Button>
            <Button component={Link} to="/signup" variant="contained" size="small" sx={{ borderRadius: 99 }}>
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
