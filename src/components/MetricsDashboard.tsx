"use client";

import React from "react";
import { ExecutionMetrics, JevRoutingDecision } from "@/lib/types";
import {
  DollarSign,
  Clock,
  Zap,
  Cpu,
  TrendingDown,
  Layers,
  ShieldCheck,
  BarChart3
} from "lucide-react";

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
      <div className="card-panel analytics-panel">
        <div className="analytics-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="panel-icon-badge" style={{ background: "rgba(37, 99, 235, 0.1)", color: "var(--gemini-blue)" }}>
              <BarChart3 size={17} />
            </div>
            <div>
              <span className="section-title">Analytics & Benchmarks</span>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Cost efficiency, execution latencies & tokens
              </p>
            </div>
          </div>
          <span className="analytics-status-pill awaiting">Awaiting Run</span>
        </div>

        <div className="analytics-preview-grid">
          <div className="analytics-stat-card">
            <span className="stat-label">Model Target</span>
            <span className="stat-value">Awaiting</span>
            <span className="stat-hint">Autonomous select</span>
          </div>
          <div className="analytics-stat-card">
            <span className="stat-label">Est. Cost Savings</span>
            <span className="stat-value val-emerald">~97%</span>
            <span className="stat-hint">vs frontier model</span>
          </div>
          <div className="analytics-stat-card">
            <span className="stat-label">Latency Expectation</span>
            <span className="stat-value">&lt; 1,200ms</span>
            <span className="stat-hint">End-to-end trace</span>
          </div>
          <div className="analytics-stat-card">
            <span className="stat-label">Jev Decision</span>
            <span className="stat-value val-emerald">&lt; 25ms</span>
            <span className="stat-hint">Typed judgment</span>
          </div>
        </div>

        <div className="analytics-empty-hint">
          <span>Run a prompt in the chat to view live cost calculations and benchmark analytics.</span>
        </div>
      </div>
    );
  }

  const jevPct =
    metrics.totalLatencyMs > 0
      ? (metrics.jevLatencyMs / metrics.totalLatencyMs) * 100
      : 25;
  const llmPct =
    metrics.totalLatencyMs > 0
      ? (metrics.llmLatencyMs / metrics.totalLatencyMs) * 100
      : 65;
  const overheadPct = Math.max(0, 100 - (jevPct + llmPct));

  return (
    <div className="card-panel analytics-panel">
      {/* Header */}
      <div className="analytics-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="panel-icon-badge" style={{ background: "rgba(5, 150, 105, 0.1)", color: "var(--jev-emerald)" }}>
            <Zap size={17} />
          </div>
          <div>
            <span className="section-title">Analytics & Cost Benchmark</span>
            <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "1px" }}>
              Dynamic routing efficiency and system benchmarks
            </p>
          </div>
        </div>
        <div className="analytics-savings-badge">
          <TrendingDown size={13} />
          <span>{metrics.costSavingsPercent}% Saved</span>
        </div>
      </div>

      {/* Hero Savings Callout */}
      <div className="analytics-hero-banner">
        <div>
          <div className="hero-kicker">Autonomous Efficiency Gain</div>
          <div className="hero-stat">{metrics.costSavingsPercent}% Cost Reduction</div>
        </div>
        <div className="hero-pill">Optimal Route</div>
      </div>

      {/* 2x2 Stat Cards Grid */}
      <div className="analytics-stats-grid">
        {/* Actual Cost */}
        <div className="analytics-stat-card">
          <div className="stat-title-row">
            <DollarSign size={13} color="var(--jev-emerald)" />
            <span>Actual Cost</span>
          </div>
          <div className="stat-value val-emerald">
            ${metrics.actualCostUsd.toFixed(6)}
          </div>
          <div className="stat-hint">
            Jev + {modelUsed.split(" ")[0]}
          </div>
        </div>

        {/* Frontier Baseline */}
        <div className="analytics-stat-card">
          <div className="stat-title-row">
            <DollarSign size={13} color="var(--text-muted)" />
            <span>Frontier Baseline</span>
          </div>
          <div className="stat-value stat-crossed">
            ${metrics.baselineUnroutedCostUsd.toFixed(6)}
          </div>
          <div className="stat-hint">If unrouted default</div>
        </div>

        {/* Latency */}
        <div className="analytics-stat-card">
          <div className="stat-title-row">
            <Clock size={13} color="var(--gemini-blue)" />
            <span>Total Latency</span>
          </div>
          <div className="stat-value">
            {metrics.totalLatencyMs}ms
          </div>
          <div className="stat-hint">
            Jev: {metrics.jevLatencyMs}ms | LLM: {metrics.llmLatencyMs}ms
          </div>
        </div>

        {/* Tokens */}
        <div className="analytics-stat-card">
          <div className="stat-title-row">
            <Layers size={13} color="var(--mistral-amber)" />
            <span>Total Tokens</span>
          </div>
          <div className="stat-value">
            {metrics.totalTokens}
          </div>
          <div className="stat-hint">
            {metrics.promptTokens} in / {metrics.completionTokens} out
          </div>
        </div>
      </div>

      {/* Per-Stage Timeline Breakdown */}
      <div className="analytics-timeline-section">
        <div className="timeline-header">
          <span>Per-Stage Latency Distribution</span>
          <span className="mono-val">{metrics.totalLatencyMs}ms total</span>
        </div>

        <div className="timeline-bar-track">
          <div
            className="timeline-segment bar-emerald"
            style={{ width: `${jevPct}%` }}
            title={`Jev Router: ${metrics.jevLatencyMs}ms (${jevPct.toFixed(0)}%)`}
          />
          <div
            className={`timeline-segment ${modelUsed.includes("Mistral") ? "bar-mistral" : "bar-gemini"}`}
            style={{ width: `${llmPct}%` }}
            title={`${modelUsed}: ${metrics.llmLatencyMs}ms (${llmPct.toFixed(0)}%)`}
          />
          {overheadPct > 0 && (
            <div
              className="timeline-segment bar-overhead"
              style={{ width: `${overheadPct}%` }}
              title={`Graph Overhead: ${metrics.overheadLatencyMs}ms (${overheadPct.toFixed(0)}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="timeline-legend">
          <div className="legend-item">
            <span className="dot dot-emerald" />
            <span>Jev Router ({metrics.jevLatencyMs}ms)</span>
          </div>
          <div className="legend-item">
            <span className={`dot ${modelUsed.includes("Mistral") ? "dot-mistral" : "dot-gemini"}`} />
            <span>{modelUsed.split(" ")[0]} ({metrics.llmLatencyMs}ms)</span>
          </div>
          {overheadPct > 0 && (
            <div className="legend-item">
              <span className="dot dot-overhead" />
              <span>Orchestration ({metrics.overheadLatencyMs}ms)</span>
            </div>
          )}
        </div>
      </div>

      {/* Security or Cost Conclusion */}
      <div className={`analytics-conclusion-box ${isBlocked ? "conclusion-blocked" : "conclusion-saved"}`}>
        {isBlocked ? (
          <ShieldCheck size={16} className="conclusion-icon" />
        ) : (
          <Cpu size={16} className="conclusion-icon" />
        )}
        <div className="conclusion-text">
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
