"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Flowchart } from "@/components/Flowchart";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { JevBarChart } from "@/components/JevBarChart";
import { ChatPanel } from "@/components/ChatPanel";
import { HistoryModal } from "@/components/HistoryModal";
import {
  PipelineExecutionResult,
  PipelineNodeId,
  TargetModel,
  PipelineEvent,
} from "@/lib/types";

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
    "How does photosynthesis work? Please explain it simply."
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
      {/* Top Navbar */}
      <Navbar
        quota={quota}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Workspace: Left (Dashboard + Pipeline) | Right (ChatPanel) */}
      <main className="main-workspace-grid">
        {/* Left Area: Dashboard (Analytics + Bar Chart) and Pipeline */}
        <div className="workspace-left-column">
          {/* Dashboard Container: Analytics + Bar Chart side-by-side */}
          <section className="dashboard-section-wrapper" aria-label="Dashboard Overview">
            <div className="dashboard-cards-grid">
              {/* Analytics Box */}
              <div className="dashboard-subcolumn">
                <MetricsDashboard
                  metrics={result?.metrics || null}
                  jev={result?.jev || null}
                  modelUsed={result?.modelUsed || ""}
                  isBlocked={result?.isBlocked || false}
                />
              </div>

              {/* Bar Chart Box */}
              <div className="dashboard-subcolumn">
                <JevBarChart
                  jev={result?.jev || null}
                  outputGuard={result?.outputGuard || null}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </section>

          {/* Pipeline Flow Diagram (Bottom of Left Column) */}
          <section className="pipeline-section-wrapper" aria-label="Pipeline Architecture">
            <Flowchart
              activeNode={activeNode}
              targetModel={targetModel}
              latencyMs={result?.totalLatencyMs}
              statusMessage={statusMessage}
            />
          </section>
        </div>

        {/* Right Sidebar: Unified Chat Environment */}
        <aside className="workspace-right-sidebar" aria-label="Chat Interaction Panel">
          <ChatPanel
            prompt={prompt}
            setPrompt={setPrompt}
            onRun={handleRun}
            isLoading={isLoading}
            result={result}
            promptsRemaining={quota.promptsRemaining}
            maxPrompts={quota.maxPrompts}
            statusMessage={statusMessage}
            onResetChat={() => setResult(null)}
          />
        </aside>
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
