import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import FeedPage from "./pages/FeedPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// ─── MUI Theme ────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5" },    // indigo
    secondary: { main: "#f59e0b" },  // amber
    background: { default: "#f3f4f6", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#6b7280" },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
      },
    },
  },
});

// ─── Protected Route wrapper ──────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // wait for auth check
  return user ? children : <Navigate to="/login" replace />;
}

// ─── Public Route (redirect if already logged in) ─────────────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <FeedPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </ThemeProvider>
  );
}
