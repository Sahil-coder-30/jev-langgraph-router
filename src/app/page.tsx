"use client";

import React, { useState } from "react";
import { PromptPanel } from "@/components/PromptPanel";
import { AnswerPanel } from "@/components/AnswerPanel";
import { Flowchart } from "@/components/Flowchart";
import { JevAnalytics } from "@/components/JevAnalytics";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { TicTacToeGame } from "@/components/TicTacToeGame";
import { UserNav } from "@/components/UserNav";
import { PipelineExecutionResult, PipelineNodeId, TargetModel, PipelineEvent } from "@/lib/types";
import { Cpu, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState(
    "Write a high-performance, generic in-memory PriorityQueue class in TypeScript with O(log n) insert and extractMin operations."
  );
  const [result, setResult] = useState<PipelineExecutionResult | null>(null);
  const [activeNode, setActiveNode] = useState<PipelineNodeId | null>(null);
  const [targetModel, setTargetModel] = useState<TargetModel | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to execute.");
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    if (!prompt.trim() || isLoading) return;

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
    }
  };

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
          <div className="header-status-badge">
            <div className="status-dot-wrapper">
              <span className="status-dot-ping" />
              <span className="status-dot" />
            </div>
            <span>Jev-latest Online</span>
            <span style={{ color: "var(--border-focus)", margin: "0 0.25rem" }}>•</span>
            <ShieldCheck size={14} color="var(--jev-emerald)" />
            <span>In-Path Firewall Active</span>
          </div>

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
        <TicTacToeGame />
      </section>
    </div>
  );
}
