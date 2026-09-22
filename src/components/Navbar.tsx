"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Zap, Swords, History, LayoutDashboard } from "lucide-react";
import { UserNav } from "./UserNav";

interface NavbarProps {
  quota: {
    promptsRemaining: number;
    promptsUsed: number;
    gamesRemaining: number;
    gamesUsed: number;
    maxPrompts: number;
    maxGames: number;
  };
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ quota, onOpenHistory }) => {
  const pathname = usePathname();

  const isDashboard = pathname === "/";
  const isGame = pathname === "/game";

  return (
    <header className="app-header" style={{ position: "relative", zIndex: 1000 }}>
      {/* Brand & Title */}
      <div className="brand-group">
        <Link href="/" className="brand-link">
          <div className="brand-icon-box">
            <Cpu size={20} />
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">TestJev</h1>
              <span className="brand-badge">System One</span>
            </div>
            <p className="brand-subtitle">
              Autonomous LangGraph routing between Mistral & Gemini
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links between Dashboard and Tic-Tac-Toe Arena */}
      <nav className="header-nav-tabs" aria-label="Main Navigation">
        <Link
          href="/"
          className={`nav-tab-pill ${isDashboard ? "active" : ""}`}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/game"
          className={`nav-tab-pill ${isGame ? "active" : ""}`}
        >
          <Swords size={15} />
          <span className="nav-label-desktop">Tic-Tac-Toe Arena</span>
          <span className="nav-label-mobile">AI Arena</span>
          <span className="nav-tab-badge">{quota.gamesRemaining} left</span>
        </Link>
      </nav>

      {/* Header Actions: Quota HUD, History, User Profile */}
      <div className="header-actions-group">
        {/* Quota HUD */}
        <div className="header-quota-hud">
          <div
            className={`header-quota-pill ${
              quota.promptsRemaining <= 1
                ? "quota-critical"
                : quota.promptsRemaining <= 2
                ? "quota-warning"
                : "quota-good"
            }`}
            title="Remaining prompt executions"
          >
            <Zap size={13} />
            <span>{quota.promptsRemaining}/{quota.maxPrompts} <span className="quota-text-label">Prompts</span></span>
          </div>

          <div
            className={`header-quota-pill ${
              quota.gamesRemaining <= 1
                ? "quota-critical"
                : quota.gamesRemaining <= 2
                ? "quota-warning"
                : "quota-good"
            }`}
            title="Remaining Tic-Tac-Toe matches"
          >
            <Swords size={13} />
            <span>{quota.gamesRemaining}/{quota.maxGames} <span className="quota-text-label">Games</span></span>
          </div>
        </div>

        {/* History Modal Trigger */}
        <button
          onClick={onOpenHistory}
          className="header-history-btn"
          title="View Cloud Activity & History"
        >
          <History size={14} />
          <span>History</span>
        </button>

        {/* User Navigation Dropdown */}
        <div className="z-20">
          <UserNav />
        </div>
      </div>
    </header>
  );
};
