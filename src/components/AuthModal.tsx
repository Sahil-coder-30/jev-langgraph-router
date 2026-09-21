"use client";

import React, { useState } from "react";
import { AuthUser } from "@/lib/auth/types";
import { Lock, Mail, Loader2, X, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  const fillDemoCredentials = () => {
    setEmail("admin@langgraph.ai");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-badge-icon">
            <ShieldCheck size={20} color="white" />
          </div>
          <h2 className="auth-modal-title">Sign In to Platform</h2>
          <p className="auth-modal-subtitle">
            Access autonomous LangGraph routing, full telemetry, and minimax evaluation
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={15} color="var(--security-red)" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          className="google-auth-btn"
          onClick={handleGoogleSignIn}
          type="button"
        >
          <svg className="google-icon-svg" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or sign in with email</span>
          <span className="auth-divider-line" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="auth-form">
          <div className="auth-field-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={15} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={15} className="auth-input-icon" />
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || !email.trim() || !password}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In / Continue</span>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Footer */}
        <div className="auth-demo-footer">
          <button type="button" className="demo-credentials-btn" onClick={fillDemoCredentials}>
            <Sparkles size={13} color="var(--gemini-blue)" />
            <span>Use Demo Account (admin@langgraph.ai)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
