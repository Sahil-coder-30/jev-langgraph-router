"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PromptPanel } from "@/components/PromptPanel";
import { AnswerPanel } from "@/components/AnswerPanel";
import { Flowchart } from "@/components/Flowchart";
import { JevAnalytics } from "@/components/JevAnalytics";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { TicTacToeGame } from "@/components/TicTacToeGame";
import { UserNav } from "@/components/UserNav";
import { HistoryModal } from "@/components/HistoryModal";
import { PipelineExecutionResult, PipelineNodeId, TargetModel, PipelineEvent } from "@/lib/types";
import { ShieldCheck, Zap, Swords, Loader2, History } from "lucide-react";

export default function DashboardPage() {
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

  const [prompt, setPrompt] = useState(
    "Write a high-performance, generic in-memory PriorityQueue class in TypeScript with O(log n) insert and extractMin operations."
  );
  const [result, setResult] = useState<PipelineExecutionResult | null>(null);
  const [activeNode, setActiveNode] = useState<PipelineNodeId | null>(null);
  const [targetModel, setTargetModel] = useState<TargetModel | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to execute.");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  // Enforce session authentication on page load
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

  const handleRun = async () => {
    if (!prompt.trim() || isLoading) return;

    if (quota.promptsRemaining <= 0) {
      setStatusMessage("Prompt quota reached: 0/5 remaining.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setActiveNode("input");
    setStatusMessage("Starting LangGraph pipeline...");

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 429) {
        const errData = await response.json().catch(() => ({}));
        setStatusMessage(errData.error || "Prompt quota limit reached (5/5 used).");
        if (errData.quota) setQuota(errData.quota);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const event: PipelineEvent = JSON.parse(trimmed.slice(6));
            setActiveNode(event.activeNode);
            setStatusMessage(event.message);

            if (event.targetModel) {
              setTargetModel(event.targetModel);
            }

            if (event.data?.jev) {
              setResult((prev) => ({
                ...(prev || ({} as PipelineExecutionResult)),
                ...(event.data as PipelineExecutionResult),
              }));
            }

            if (event.step === "COMPLETED" || event.step === "BLOCKED") {
              if (event.data) {
                setResult(event.data as PipelineExecutionResult);
              }
            }
          } catch (parseErr) {
            console.warn("Event parse error:", parseErr);
          }
        }
      }
    } catch (err: unknown) {
      console.error("Execution error:", err);
      setStatusMessage("Execution encountered an error.");
      setActiveNode("security");
    } finally {
      setIsLoading(false);
      await fetchQuota();
    }
  };

  if (isAuthChecking) {
    return (
      <div className="login-loading-screen">
        <div className="login-spinner" />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Verifying Google OAuth & Session Quota...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-badge">SYSTEM ONE</div>
          <div>
            <h1 className="brand-title">Jev Autonomous LangGraph Router</h1>
            <p className="brand-subtitle">
              Calibrated ~150ms semantic probability routing between Mistral Large & Google Gemini
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Header Quota HUD */}
          <div className="header-quota-hud">
            <div
              className={`header-quota-pill ${
                quota.promptsRemaining <= 1
                  ? "quota-critical"
                  : quota.promptsRemaining <= 2
                  ? "quota-warning"
                  : "quota-good"
              }`}
              title="Remaining prompt executions for your session"
            >
              <Zap size={13} />
              <span>
                Prompts: <strong>{quota.promptsRemaining}</strong>/{quota.maxPrompts}
              </span>
            </div>

            <div
              className={`header-quota-pill ${
                quota.gamesRemaining <= 1
                  ? "quota-critical"
                  : quota.gamesRemaining <= 2
                  ? "quota-warning"
                  : "quota-good"
              }`}
              title="Remaining Tic-Tac-Toe matches for your session"
            >
              <Swords size={13} />
              <span>
                Games: <strong>{quota.gamesRemaining}</strong>/{quota.maxGames}
              </span>
            </div>
          </div>

          <div className="header-status-badge">
            <div className="status-dot-wrapper">
              <span className="status-dot-ping" />
              <span className="status-dot" />
            </div>
            <span>Jev-latest Online</span>
            <span style={{ color: "var(--border-focus)", margin: "0 0.25rem" }}>•</span>
            <ShieldCheck size={14} color="var(--jev-emerald)" />
            <span>In-Path Firewall</span>
          </div>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="header-history-btn"
            title="View MongoDB Cloud Activity & History"
          >
            <History size={14} />
            <span>Cloud History</span>
          </button>

          <UserNav />
        </div>
      </header>

      {/* Main Interaction Area (2 Columns) */}
      <main className="dashboard-grid">
        {/* Left Column: Prompting & Formatted Scrollable Output */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <PromptPanel
            prompt={prompt}
            setPrompt={setPrompt}
            onRun={handleRun}
            isLoading={isLoading}
            promptsRemaining={quota.promptsRemaining}
            maxPrompts={quota.maxPrompts}
          />

          <AnswerPanel result={result} isLoading={isLoading} />
        </div>

        {/* Right Column: All Metrics & Intelligence Dashboard */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <MetricsDashboard
            metrics={result?.metrics || null}
            jev={result?.jev || null}
            modelUsed={result?.modelUsed || ""}
            isBlocked={result?.isBlocked || false}
          />

          <JevAnalytics decision={result?.jev || null} isLoading={isLoading} />
        </aside>
      </main>

      {/* Bottom Section: Realtime Flowchart */}
      <section>
        <Flowchart
          activeNode={activeNode}
          targetModel={targetModel}
          latencyMs={result?.totalLatencyMs}
          statusMessage={statusMessage}
        />
      </section>

      {/* Autonomous AI Tic-Tac-Toe Arena */}
      <section style={{ marginTop: "1.25rem" }}>
        <TicTacToeGame
          gamesRemaining={quota.gamesRemaining}
          maxGames={quota.maxGames}
          onConsumeGame={handleConsumeGame}
        />
      </section>

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
