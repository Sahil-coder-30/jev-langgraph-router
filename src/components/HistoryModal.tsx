"use client";

import React, { useState, useEffect } from "react";
import { History, X, Cpu, Zap, Swords, Trophy, ShieldAlert, Sparkles, CheckCircle, Clock } from "lucide-react";

interface PromptRecord {
  _id: string;
  prompt: string;
  response: string;
  modelUsed: string;
  targetModel: string;
  confidence?: number;
  isBlocked: boolean;
  blockReason?: string;
  totalLatencyMs: number;
  tokensEstimated: number;
  metrics?: {
    actualCostUsd: number;
    baselineUnroutedCostUsd: number;
    costSavingsPercent: number;
    promptTokens: number;
    completionTokens: number;
  };
  createdAt: string;
}

interface GameRecord {
  _id: string;
  winner: "X" | "O" | "tie";
  difficulty: string;
  scores?: { player: number; bot: number; ties: number };
  commentary?: string;
  createdAt: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptsRemaining: number;
  gamesRemaining: number;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  promptsRemaining,
  gamesRemaining,
}) => {
  const [activeTab, setActiveTab] = useState<"prompts" | "games">("prompts");
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/user/history");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.history) {
            setPrompts(data.history.prompts || []);
            setGames(data.history.games || []);
          }
        }
      } catch (err) {
        console.error("Failed to load cloud history:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="auth-modal-overlay history-modal-overlay" onClick={onClose}>
      <div className="card-panel history-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div className="panel-icon-badge" style={{ background: "rgba(37, 99, 235, 0.1)", color: "var(--gemini-blue)" }}>
              <History size={18} />
            </div>
            <div>
              <h2 className="auth-modal-title" style={{ fontSize: "1.15rem" }}>
                MongoDB Cloud Activity & History
              </h2>
              <p className="auth-modal-subtitle">
                Real-time persistence for prompts, router choices & AI arena games
              </p>
            </div>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Quota & Database Summary Bar */}
        <div className="history-summary-bar">
          <div className="history-summary-chip">
            <Zap size={14} color="#059669" />
            <span>Prompts Left: <strong>{promptsRemaining}</strong> / 5</span>
          </div>
          <div className="history-summary-chip">
            <Swords size={14} color="#d97706" />
            <span>Games Left: <strong>{gamesRemaining}</strong> / 5</span>
          </div>
          <div className="history-summary-chip db-chip">
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span>MongoDB Atlas (jev)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="history-tabs-nav">
          <button
            className={`history-tab-btn ${activeTab === "prompts" ? "active" : ""}`}
            onClick={() => setActiveTab("prompts")}
          >
            <Zap size={14} />
            <span>Prompt Pipeline Runs ({prompts.length})</span>
          </button>
          <button
            className={`history-tab-btn ${activeTab === "games" ? "active" : ""}`}
            onClick={() => setActiveTab("games")}
          >
            <Swords size={14} />
            <span>Tic-Tac-Toe Arena Matches ({games.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="history-list-container">
          {isLoading ? (
            <div className="history-loading-box">
              <span className="btn-spinner" style={{ borderColor: "rgba(37, 99, 235, 0.2)", borderTopColor: "var(--gemini-blue)" }} />
              <p>Fetching history from MongoDB Atlas...</p>
            </div>
          ) : activeTab === "prompts" ? (
            prompts.length === 0 ? (
              <div className="history-empty-box">
                <Sparkles size={24} color="#94a3b8" />
                <p>No prompt pipeline runs recorded yet.</p>
                <span>Execute a prompt to see its routing breakdown stored in MongoDB!</span>
              </div>
            ) : (
              <div className="history-cards-scroll">
                {prompts.map((item) => (
                  <div key={item._id} className="history-item-card">
                    <div className="history-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={`history-target-pill ${item.isBlocked ? "pill-blocked" : item.targetModel === "mistral_large" ? "pill-mistral" : "pill-gemini"}`}>
                          {item.isBlocked ? "Security Blocked" : item.targetModel === "mistral_large" ? "Mistral Large" : "Google Gemini"}
                        </span>
                        {item.metrics?.costSavingsPercent !== undefined && !item.isBlocked && (
                          <span className="history-savings-pill">
                            {item.metrics.costSavingsPercent.toFixed(1)}% Saved
                          </span>
                        )}
                      </div>
                      <div className="history-timestamp">
                        <Clock size={12} />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    <p className="history-prompt-text">&ldquo;{item.prompt}&rdquo;</p>

                    <div className="history-meta-row">
                      <span>Latency: <strong>{item.totalLatencyMs}ms</strong></span>
                      <span>•</span>
                      <span>Tokens: <strong>{item.tokensEstimated}</strong></span>
                      <span>•</span>
                      <span>Model: <strong>{item.modelUsed}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : games.length === 0 ? (
            <div className="history-empty-box">
              <Trophy size={24} color="#94a3b8" />
              <p>No Tic-Tac-Toe matches recorded yet.</p>
              <span>Play against the Autonomous Minimax Bot to save matches here!</span>
            </div>
          ) : (
            <div className="history-cards-scroll">
              {games.map((item) => (
                <div key={item._id} className="history-item-card">
                  <div className="history-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={`history-winner-pill ${item.winner === "X" ? "winner-user" : item.winner === "O" ? "winner-bot" : "winner-tie"}`}>
                        {item.winner === "X" ? "🏆 You Won" : item.winner === "O" ? "🤖 Bot Won" : "🤝 Draw"}
                      </span>
                      <span className="history-diff-pill">
                        {item.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <div className="history-timestamp">
                      <Clock size={12} />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {item.commentary && (
                    <p className="history-commentary-text">&ldquo;{item.commentary}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
