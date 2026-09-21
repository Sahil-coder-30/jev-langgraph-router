"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthUser } from "@/lib/auth/types";
import { AuthModal } from "./AuthModal";
import { LogIn, LogOut, User as UserIcon, Shield, ChevronDown } from "lucide-react";

export const UserNav: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current session on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMe();

    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsDropdownOpen(false);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="user-nav-skeleton">
        <span className="skeleton-pill" />
      </div>
    );
  }

  return (
    <>
      {user ? (
        <div className="user-profile-wrapper" ref={dropdownRef}>
          <button
            className="user-profile-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="user-avatar-img" />
            ) : (
              <div className="user-avatar-fallback">{getInitials(user.name)}</div>
            )}
            <div className="user-info-snippet">
              <span className="user-name-label">{user.name}</span>
              <span className="user-provider-tag">
                {user.provider === "google" ? "Google OAuth" : "Verified"}
              </span>
            </div>
            <ChevronDown size={14} className={`dropdown-chevron ${isDropdownOpen ? "open" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <p className="dropdown-user-name">{user.name}</p>
                <p className="dropdown-user-email">{user.email}</p>
              </div>

              <div className="dropdown-divider" />

              <div className="dropdown-section-item">
                <Shield size={13} color="var(--jev-emerald)" />
                <span>Session Active • HTTP-Only Cookie</span>
              </div>

              <div className="dropdown-divider" />

              <button className="dropdown-logout-btn" onClick={handleLogout}>
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="header-signin-btn"
          onClick={() => setIsModalOpen(true)}
          title="Sign in with Google or Email"
        >
          <LogIn size={14} />
          <span>Sign In</span>
        </button>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />
    </>
  );
};
