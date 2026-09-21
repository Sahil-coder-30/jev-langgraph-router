"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Cpu, Swords, Zap, ArrowRight, CheckCircle2, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            router.replace("/");
            return;
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("admin@langgraph.ai");
    setPassword("password123");
    setError(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="login-loading-screen">
        <div className="login-spinner" />
        <p>Verifying secure session...</p>
      </div>
    );
  }

  return (
    <div className="login-page-container">
      {/* Background glowing ambient orbs */}
      <div className="login-ambient-orb orb-1" />
      <div className="login-ambient-orb orb-2" />

      <div className="login-card-wrapper">
        {/* Top Branding Pill */}
        <div className="login-badge-header">
          <div className="brand-badge" style={{ fontSize: "0.72rem" }}>SYSTEM ONE SECURE PORTAL</div>
          <div className="login-live-ping">
            <span className="status-dot-ping" />
            <span className="status-dot" />
            <span>Jev Router Online</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="login-title">Sign In to Jev Router</h1>
        <p className="login-subtitle">
          Calibrated ~150ms semantic probability routing between <strong>Mistral Large</strong> & <strong>Google Gemini</strong>.
        </p>

        {/* Quota Highlights Banner */}
        <div className="login-quota-banner">
          <div className="quota-banner-badge">
            <Zap size={14} color="#059669" />
            <span>Each User Account Includes:</span>
          </div>
          <div className="quota-perks-grid">
            <div className="perk-item">
              <CheckCircle2 size={15} color="#059669" />
              <span><strong>5 Free</strong> Prompt Executions</span>
            </div>
            <div className="perk-item">
              <CheckCircle2 size={15} color="#059669" />
              <span><strong>5 Free</strong> Tic-Tac-Toe Matches</span>
            </div>
            <div className="perk-item">
              <CheckCircle2 size={15} color="#059669" />
              <span><strong>Zero</strong> Data Leakage Firewall</span>
            </div>
            <div className="perk-item">
              <CheckCircle2 size={15} color="#059669" />
              <span><strong>Realtime</strong> SSE Benchmarks</span>
            </div>
          </div>
        </div>

        {/* Primary Action: Google OAuth Button */}
        <div className="login-primary-actions">
          <a
            href="/api/auth/google"
            className="google-auth-btn-hero"
            id="google-signin-btn"
          >
            <svg className="google-icon-svg" viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight size={17} className="btn-arrow" />
          </a>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span className="divider-line" />
          <span className="divider-text">OR SIGN IN WITH EMAIL</span>
          <span className="divider-line" />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="login-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="login-email-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <button
                type="button"
                className="demo-account-chip"
                onClick={fillDemoAccount}
                title="Fill demo credentials"
              >
                Use Demo Account
              </button>
            </div>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="email-signin-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading-flex">
                <span className="btn-spinner" />
                <span>Verifying...</span>
              </span>
            ) : (
              <span className="btn-flex">
                <Lock size={15} />
                <span>Sign In with Password</span>
              </span>
            )}
          </button>
        </form>

        {/* Bottom Trust Badge */}
        <div className="login-footer-trust">
          <ShieldCheck size={14} color="#059669" />
          <span>Protected by Google OAuth 2.0 & Encrypted Session Cookies</span>
        </div>
      </div>
    </div>
  );
}
