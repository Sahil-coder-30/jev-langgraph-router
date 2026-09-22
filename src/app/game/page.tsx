"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { TicTacToeGame, TicTacToeStateUpdate } from "@/components/TicTacToeGame";
import { JevGameDashboard, JevGameEvaluationData } from "@/components/JevGameDashboard";
import { HistoryModal } from "@/components/HistoryModal";
import { Swords, Trophy, Zap, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GamePage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [quota, setQuota] = useState({
    promptsRemaining: 5,
    promptsUsed: 0,
    gamesRemaining: 5,
    gamesUsed: 0,
    maxPrompts: 5,
    maxGames: 5,
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Real-time Jev model probability state
  const [jevEvaluation, setJevEvaluation] = useState<JevGameEvaluationData | null>(null);
  const [isJevLoading, setIsJevLoading] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<(string | null)[]>(Array(9).fill(null));

  // Fetch updated quota from server
  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/user/quota");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.quota) {
          setQuota(data.quota);
        }
      }
    } catch (err) {
      console.error("Failed to fetch quota:", err);
    }
  }, [router]);

  // Handle board changes and fetch Jev model probabilities in real time
  const handleStateUpdate = useCallback(async (update: TicTacToeStateUpdate) => {
    setCurrentBoard(update.board);
    setIsJevLoading(true);
    try {
      const res = await fetch("/api/game/jev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: update.board,
          moveCount: update.moveCount,
          playerTurn: update.playerTurn,
          difficulty: update.difficulty,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setJevEvaluation(data);
      }
    } catch (err) {
      console.warn("Failed to fetch Jev game evaluation:", err);
    } finally {
      setIsJevLoading(false);
    }
  }, []);

  // Enforce session authentication on page load (Protected Route)
  useEffect(() => {
    async function checkAuthAndLoadQuota() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.replace("/login");
          return;
        }
        await fetchQuota();
      } catch {
        router.replace("/login");
      } finally {
        setIsAuthChecking(false);
      }
    }

    checkAuthAndLoadQuota();
  }, [router, fetchQuota]);

  // Consume 1 game in Tic-Tac-Toe and record match outcome in MongoDB
  const handleConsumeGame = async (gameData?: {
    winner: "X" | "O" | "tie";
    difficulty: string;
    scores: { player: number; bot: number; ties: number };
    commentary: string;
  }) => {
    try {
      const res = await fetch("/api/user/quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consume_game", ...(gameData || {}) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quota) {
          setQuota(data.quota);
        }
      }
    } catch (err) {
      console.error("Failed to consume game quota:", err);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="login-loading-screen">
        <div className="login-spinner" />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Verifying session & entering AI Arena...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        quota={quota}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Game Page Content */}
      <main className="game-page-content">
        {/* Game Navigation Sub-Header */}
        <div className="game-page-banner">
          <div className="game-banner-left">
            <Link href="/" className="game-back-link">
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </Link>
            <div className="game-title-group">
              <h2 className="game-page-title">
                Autonomous AI Tic-Tac-Toe Arena
              </h2>
              <p className="game-page-desc">
                Play against minimax intelligence while LangGraph logs games to MongoDB.
              </p>
            </div>
          </div>

          <div className="game-banner-stats">
            <div className="game-stat-badge">
              <Trophy size={14} color="#f59e0b" />
              <span>Master AI Engine</span>
            </div>
            <div className="game-stat-badge">
              <Swords size={14} color="var(--gemini-blue)" />
              <span>{quota.gamesRemaining} Matches Left</span>
            </div>
          </div>
        </div>

        {/* The Game Component & Jev Model Probability Dashboard Grid */}
        <div className="game-arena-wrapper">
          <TicTacToeGame
            gamesRemaining={quota.gamesRemaining}
            maxGames={quota.maxGames}
            onConsumeGame={handleConsumeGame}
            onStateUpdate={handleStateUpdate}
          />

          <JevGameDashboard
            evaluation={jevEvaluation}
            isLoading={isJevLoading}
            board={currentBoard}
          />
        </div>
      </main>

      {/* MongoDB Cloud Activity & History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        promptsRemaining={quota.promptsRemaining}
        gamesRemaining={quota.gamesRemaining}
      />
    </div>
  );
}
