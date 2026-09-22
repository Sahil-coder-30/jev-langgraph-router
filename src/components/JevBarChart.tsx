"use client";

import React, { useState } from "react";
import { JevRoutingDecision, JevOutputGuardDecision } from "@/lib/types";
import {
  BarChart3,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sparkles,
  Bot,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";

interface JevBarChartProps {
  jev: JevRoutingDecision | null;
  outputGuard?: JevOutputGuardDecision | null;
  isLoading?: boolean;
}

type TabKey = "all" | "routing" | "safety";

export const JevBarChart: React.FC<JevBarChartProps> = ({
  jev,
  outputGuard,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  if (!jev) {
    return (
      <div className="card-panel barchart-panel">
        <div className="barchart-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <div className="panel-icon-badge" style={{ background: "rgba(37, 99, 235, 0.1)", color: "var(--gemini-blue)" }}>
              <BarChart3 size={17} />
            </div>
            <div>
              <span className="section-title">Jev Output Metrics</span>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Calibrated probability judgments across models & security
              </p>
            </div>
          </div>
          <span className="barchart-status-badge awaiting">Awaiting Run</span>
        </div>

        {/* Empty state placeholder bars preview */}
        <div className="barchart-empty-container">
          <div className="barchart-preview-list">
            <div className="barchart-preview-row">
              <div className="preview-label-group">
                <Sparkles size={14} color="var(--gemini-blue)" />
                <span>Google Gemini Probability</span>
              </div>
              <div className="preview-bar-track">
                <div className="preview-bar-fill preview-gemini" style={{ width: "85%" }} />
              </div>
              <span className="preview-val">85%</span>
            </div>

            <div className="barchart-preview-row">
              <div className="preview-label-group">
                <Bot size={14} color="var(--mistral-amber)" />
                <span>Mistral Large Probability</span>
              </div>
              <div className="preview-bar-track">
                <div className="preview-bar-fill preview-mistral" style={{ width: "15%" }} />
              </div>
              <span className="preview-val">15%</span>
            </div>

            <div className="barchart-preview-row">
              <div className="preview-label-group">
                <ShieldCheck size={14} color="var(--jev-emerald)" />
                <span>Safety / Integrity Confidence</span>
              </div>
              <div className="preview-bar-track">
                <div className="preview-bar-fill preview-emerald" style={{ width: "98%" }} />
              </div>
              <span className="preview-val">98%</span>
            </div>

            <div className="barchart-preview-row">
              <div className="preview-label-group">
                <ShieldAlert size={14} color="var(--security-red)" />
                <span>Jailbreak / Threat Score</span>
              </div>
              <div className="preview-bar-track">
                <div className="preview-bar-fill preview-red" style={{ width: "2%" }} />
              </div>
              <span className="preview-val">2%</span>
            </div>
          </div>
          <p className="barchart-hint-text">
            Run a prompt to see Jev&apos;s real-time multi-dimensional judgment outputs visualized here.
          </p>
        </div>
      </div>
    );
  }

  const mistralProb = Math.round((jev.probabilities?.mistral_large ?? 0) * 100);
  const geminiProb = Math.round((jev.probabilities?.gemini_flash_pro ?? 0) * 100);
  const confidenceScore = Math.round((jev.confidence ?? 0) * 100);

  const isSafeProb = Math.round((jev.safety?.isSafeProb ?? 0.98) * 100);
  const jailbreakProb = Math.round((jev.safety?.jailbreakProb ?? 0.02) * 100);
  const severityScore = jev.safety?.severityScore ?? 0;
  const severityPct = Math.min(100, Math.round((severityScore / 3) * 100));

  const guardViolationProb = outputGuard
    ? Math.round(outputGuard.policyViolationProb * 100)
    : 0;

  const isBlocked = jev.targetModel === "blocked";
  const isMistral = jev.targetModel === "mistral_large";
  const isGemini = jev.targetModel === "gemini_flash_pro";

  return (
    <div className="card-panel barchart-panel">
      {/* Header */}
      <div className="barchart-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <div className="panel-icon-badge" style={{ background: "rgba(5, 150, 105, 0.1)", color: "var(--jev-emerald)" }}>
            <BarChart3 size={17} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span className="section-title">Jev Output Bar Chart</span>
              <span className="barchart-latency-pill">
                <Clock size={11} /> {jev.latencyMs}ms inference
              </span>
            </div>
            <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "1px" }}>
              Multi-dimensional output breakdown for decision transparency
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="barchart-tab-buttons">
          <button
            type="button"
            className={`barchart-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`barchart-tab-btn ${activeTab === "routing" ? "active" : ""}`}
            onClick={() => setActiveTab("routing")}
          >
            Routing
          </button>
          <button
            type="button"
            className={`barchart-tab-btn ${activeTab === "safety" ? "active" : ""}`}
            onClick={() => setActiveTab("safety")}
          >
            Safety
          </button>
        </div>
      </div>

      {/* Decision Summary Banner */}
      <div className={`barchart-decision-banner ${isBlocked ? "banner-blocked" : isMistral ? "banner-mistral" : "banner-gemini"}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isBlocked ? (
            <ShieldAlert size={17} />
          ) : isMistral ? (
            <Bot size={17} />
          ) : (
            <Sparkles size={17} />
          )}
          <span className="banner-title">
            <strong>Target:</strong> {isBlocked ? "Security Blocked" : isMistral ? "Mistral Large" : "Google Gemini"}
          </span>
        </div>
        <span className="banner-confidence">
          Confidence: <strong>{confidenceScore}%</strong>
        </span>
      </div>

      {/* Bars Container */}
      <div className="barchart-bars-container">
        {/* SECTION 1: ROUTING PROBABILITIES */}
        {(activeTab === "all" || activeTab === "routing") && (
          <div className="barchart-group">
            <div className="barchart-group-title">
              <GitBranch size={13} /> Model Routing Probabilities
            </div>

            {/* Bar: Google Gemini */}
            <div className="barchart-row">
              <div className="bar-label-group">
                <span className="bar-name">Google Gemini Flash</span>
                <span className="bar-role">General / Concise</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-gemini"
                  style={{ width: `${geminiProb}%` }}
                />
              </div>
              <div className="bar-value-pill val-gemini">
                {geminiProb}%
              </div>
            </div>

            {/* Bar: Mistral Large */}
            <div className="barchart-row">
              <div className="bar-label-group">
                <span className="bar-name">Mistral Large</span>
                <span className="bar-role">Complex / In-depth</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-mistral"
                  style={{ width: `${mistralProb}%` }}
                />
              </div>
              <div className="bar-value-pill val-mistral">
                {mistralProb}%
              </div>
            </div>

            {/* Bar: Decision Certainty */}
            <div className="barchart-row">
              <div className="bar-label-group">
                <span className="bar-name">Decision Certainty</span>
                <span className="bar-role">Calibration Score</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-emerald"
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
              <div className="bar-value-pill val-emerald">
                {confidenceScore}%
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SAFETY & GUARDRAILS */}
        {(activeTab === "all" || activeTab === "safety") && (
          <div className="barchart-group">
            <div className="barchart-group-title">
              <ShieldCheck size={13} /> Safety & Guardrail Verification
            </div>

            {/* Bar: Safe Content Probability */}
            <div className="barchart-row">
              <div className="bar-label-group">
                <span className="bar-name">Safety Probability</span>
                <span className="bar-role">Harmlessness Check</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-emerald"
                  style={{ width: `${isSafeProb}%` }}
                />
              </div>
              <div className="bar-value-pill val-emerald">
                {isSafeProb}%
              </div>
            </div>

            {/* Bar: Jailbreak / Adversarial Attack */}
            <div className="barchart-row">
              <div className="bar-label-group">
                <span className="bar-name">Jailbreak Risk</span>
                <span className="bar-role">DAN / Prompt Injection</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-red"
                  style={{ width: `${jailbreakProb}%` }}
                />
              </div>
              <div className={`bar-value-pill ${jailbreakProb > 25 ? "val-red-alert" : "val-muted"}`}>
                {jailbreakProb}%
              </div>
            </div>

            {/* Bar: Threat Severity */}
            <div className="barchart-row">
              <div className="bar-label-group">
                <span className="bar-name">Threat Severity</span>
                <span className="bar-role">{severityScore.toFixed(2)} / 3.0 scale</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-amber"
                  style={{ width: `${severityPct}%` }}
                />
              </div>
              <div className="bar-value-pill val-amber">
                {severityPct}%
              </div>
            </div>

            {/* Bar: Output Guardrail Violation */}
            {outputGuard && (
              <div className="barchart-row">
                <div className="bar-label-group">
                  <span className="bar-name">Output Policy Violation</span>
                  <span className="bar-role">
                    {outputGuard.allowed ? "Passed" : "Blocked"} • {outputGuard.latencyMs}ms
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${outputGuard.allowed ? "bar-emerald" : "bar-red"}`}
                    style={{ width: `${guardViolationProb}%` }}
                  />
                </div>
                <div className={`bar-value-pill ${outputGuard.allowed ? "val-emerald" : "val-red-alert"}`}>
                  {guardViolationProb}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Reasoning */}
      <div className="barchart-footer">
        <div className="barchart-reasoning-snippet">
          <strong>Jev Reasoning:</strong> &quot;{jev.reasoning || "Optimal route selected by System One classifier."}&quot;
        </div>
      </div>
    </div>
  );
};
