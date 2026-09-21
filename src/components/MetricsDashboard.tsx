"use client";

import React from "react";
import { ExecutionMetrics, JevRoutingDecision } from "@/lib/types";
import { DollarSign, Clock, Zap, Cpu, TrendingDown, Layers, ShieldCheck, BarChart3 } from "lucide-react";

interface MetricsDashboardProps {
  metrics: ExecutionMetrics | null;
  jev: JevRoutingDecision | null;
  modelUsed: string;
  isBlocked: boolean;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  jev,
  modelUsed,
  isBlocked,
}) => {
  if (!metrics) {
    return (
      <div className="card-panel" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={17} color="var(--gemini-blue)" />
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
              Cost & Latency Intelligence
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Standing By</span>
        </div>

        <div style={{ padding: "0.75rem 0", display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <p>
            When a prompt executes, this dashboard calculates exact <strong>real-time cost savings</strong> and <strong>per-stage millisecond timing</strong>.
          </p>

          <div style={{ background: "var(--bg-subtle)", padding: "0.65rem 0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.8rem" }}>Monitored Cost Rates:</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>• Unrouted Frontier Default:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>$3.00 / $15.00 /1M</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>• Google Gemini Flash Lite:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--gemini-blue)" }}>$0.075 / $0.30 /1M</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>• Mistral (Nemo):</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--mistral-amber)" }}>$0.150 / $0.60 /1M</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>• TypeSafe Jev Router:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--jev-emerald)" }}>~$0.000040 /query</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const jevPct = metrics.totalLatencyMs > 0 ? (metrics.jevLatencyMs / metrics.totalLatencyMs) * 100 : 30;
  const llmPct = metrics.totalLatencyMs > 0 ? (metrics.llmLatencyMs / metrics.totalLatencyMs) * 100 : 60;
  const overheadPct = Math.max(0, 100 - (jevPct + llmPct));

  return (
    <div className="card-panel metrics-dashboard-panel" style={{ border: "1px solid var(--border-focus)", background: "#ffffff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <Zap size={17} color="var(--jev-emerald)" />
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
            Execution & Cost Benchmark
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", background: "var(--jev-emerald-light)", color: "var(--jev-emerald)", padding: "0.2rem 0.55rem", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
          <TrendingDown size={13} />
          {metrics.costSavingsPercent}% Saved
        </div>
      </div>

      {/* Hero Savings Callout */}
      <div
        style={{
          background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          border: "1px solid #a7f3d0",
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 0.9rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(5, 150, 105, 0.08)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#065f46", letterSpacing: "0.05em" }}>
            Autonomous Efficiency Gain
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#047857", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
            {metrics.costSavingsPercent}% Cost Reduction
          </div>
        </div>
        <div
          style={{
            background: "#059669",
            color: "white",
            borderRadius: "var(--radius-full)",
            padding: "0.3rem 0.65rem",
            fontSize: "0.74rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: "0 2px 5px rgba(5, 150, 105, 0.3)",
          }}
        >
          Optimal Route
        </div>
      </div>

      {/* 2x2 Stat Cards Grid (Optimal for Sidebar) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
        {/* Card 1: Actual Cost */}
        <div style={{ background: "var(--bg-subtle)", padding: "0.65rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            <DollarSign size={13} color="var(--jev-emerald)" />
            Actual Cost
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--jev-emerald)", fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
            ${metrics.actualCostUsd.toFixed(6)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            Jev + {modelUsed.split(" ")[0]}
          </div>
        </div>

        {/* Card 2: Baseline Cost Avoided */}
        <div style={{ background: "var(--bg-subtle)", padding: "0.65rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            <DollarSign size={13} color="var(--text-muted)" />
            Frontier Baseline
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-muted)", textDecoration: "line-through", fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
            ${metrics.baselineUnroutedCostUsd.toFixed(6)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            If unrouted
          </div>
        </div>

        {/* Card 3: Total End-to-End Latency */}
        <div style={{ background: "var(--bg-subtle)", padding: "0.65rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            <Clock size={13} color="var(--gemini-blue)" />
            Total Latency
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
            {metrics.totalLatencyMs}ms
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            Jev: {metrics.jevLatencyMs}ms | LLM: {metrics.llmLatencyMs}ms
          </div>
        </div>

        {/* Card 4: Tokens Processed */}
        <div style={{ background: "var(--bg-subtle)", padding: "0.65rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            <Layers size={13} color="var(--mistral-amber)" />
            Total Tokens
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
            {metrics.totalTokens}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            {metrics.promptTokens} in / {metrics.completionTokens} out
          </div>
        </div>
      </div>

      {/* Latency Segmented Distribution Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.35rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
          <span>Per-Stage Time Breakdown</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{metrics.totalLatencyMs}ms total</span>
        </div>

        <div style={{ height: "10px", width: "100%", display: "flex", borderRadius: "var(--radius-full)", overflow: "hidden", background: "var(--bg-muted)" }}>
          <div
            style={{ width: `${jevPct}%`, background: "var(--jev-emerald)", transition: "width 0.5s ease" }}
            title={`Jev Router: ${metrics.jevLatencyMs}ms (${jevPct.toFixed(0)}%)`}
          />
          <div
            style={{
              width: `${llmPct}%`,
              background: modelUsed.includes("Mistral") ? "var(--mistral-amber)" : "var(--gemini-blue)",
              transition: "width 0.5s ease",
            }}
            title={`${modelUsed}: ${metrics.llmLatencyMs}ms (${llmPct.toFixed(0)}%)`}
          />
          {overheadPct > 0 && (
            <div
              style={{ width: `${overheadPct}%`, background: "#94a3b8", transition: "width 0.5s ease" }}
              title={`Graph Orchestration: ${metrics.overheadLatencyMs}ms (${overheadPct.toFixed(0)}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--jev-emerald)" }} />
            <span>Jev Router ({metrics.jevLatencyMs}ms)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: modelUsed.includes("Mistral") ? "var(--mistral-amber)" : "var(--gemini-blue)",
              }}
            />
            <span>
              {modelUsed.split(" ")[0]} ({metrics.llmLatencyMs}ms)
            </span>
          </div>
        </div>
      </div>

      {/* ROI / Savings Summary */}
      <div
        style={{
          background: isBlocked ? "var(--security-red-light)" : "var(--jev-emerald-light)",
          border: `1px solid ${isBlocked ? "var(--security-red-border)" : "var(--jev-emerald-border)"}`,
          padding: "0.6rem 0.75rem",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.78rem",
          color: isBlocked ? "var(--security-red)" : "#065f46",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          lineHeight: 1.4,
        }}
      >
        {isBlocked ? <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: "2px" }} /> : <Cpu size={16} style={{ flexShrink: 0, marginTop: "2px" }} />}
        <div>
          {isBlocked ? (
            <span>
              <strong>Security Terminated:</strong> Intercepted in <strong>{metrics.jevLatencyMs}ms</strong>. 100% of LLM compute avoided ($0.00 spent).
            </span>
          ) : (
            <span>
              <strong>Cost Saved:</strong> Achieved <strong>{metrics.costSavingsPercent}% cost reduction</strong> vs default frontier model with <strong>{metrics.totalLatencyMs}ms</strong> total response.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
