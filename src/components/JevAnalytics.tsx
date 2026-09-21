"use client";

import React from "react";
import { JevRoutingDecision } from "@/lib/types";
import { Activity, Gauge, Shield, Brain } from "lucide-react";

interface JevAnalyticsProps {
  decision: JevRoutingDecision | null;
  isLoading: boolean;
}

export const JevAnalytics: React.FC<JevAnalyticsProps> = ({ decision, isLoading }) => {
  const probMistral = decision?.probabilities.mistral_large ?? 0.5;
  const probGemini = decision?.probabilities.gemini_flash_pro ?? 0.5;
  const confidence = decision?.confidence ?? 0;
  const jailbreakProb = decision?.safety.jailbreakProb ?? 0;
  const severity = decision?.safety.severityScore ?? 0;

  return (
    <div className="card-panel analytics-card">
      <div className="prompt-section-header">
        <span className="section-title">
          <Activity size={18} color="var(--jev-emerald)" />
          Jev System One Analytics
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {decision ? `${decision.latencyMs}ms inference` : "Idle"}
        </span>
      </div>

      {/* Probability Distribution */}
      <div className="meter-group">
        <div className="meter-header">
          <span style={{ color: "var(--mistral-amber)", fontWeight: 600 }}>Mistral Large (Code/Logic)</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {decision ? `${(probMistral * 100).toFixed(0)}%` : "--"}
          </span>
        </div>
        <div className="meter-track">
          <div
            className="meter-fill fill-mistral"
            style={{ width: decision ? `${probMistral * 100}%` : "50%" }}
          />
        </div>
      </div>

      <div className="meter-group">
        <div className="meter-header">
          <span style={{ color: "var(--gemini-blue)", fontWeight: 600 }}>Google Gemini (Creative/Synthesis)</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {decision ? `${(probGemini * 100).toFixed(0)}%` : "--"}
          </span>
        </div>
        <div className="meter-track">
          <div
            className="meter-fill fill-gemini"
            style={{ width: decision ? `${probGemini * 100}%` : "50%" }}
          />
        </div>
      </div>

      {/* Confidence Dial Card */}
      <div
        style={{
          background: "var(--bg-subtle)",
          padding: "0.85rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Gauge size={20} color="var(--jev-emerald)" />
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Routing Certainty
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Calibrated Confidence
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: confidence > 0.8 ? "var(--jev-emerald)" : confidence > 0.5 ? "var(--gemini-blue)" : "var(--mistral-amber)",
          }}
        >
          {decision ? `${(confidence * 100).toFixed(0)}%` : "--"}
        </div>
      </div>

      {/* Safety & Hazard Matrix */}
      <div className="safety-matrix">
        <div className="matrix-stat">
          <span className="matrix-label">Jailbreak Threat</span>
          <span
            className="matrix-value"
            style={{
              color: jailbreakProb > 0.5 ? "var(--security-red)" : "var(--jev-emerald)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {decision ? `${(jailbreakProb * 100).toFixed(0)}%` : "0%"}
          </span>
        </div>

        <div className="matrix-stat">
          <span className="matrix-label">Severity Level</span>
          <span
            className="matrix-value"
            style={{
              color: severity >= 2.0 ? "var(--security-red)" : severity >= 1.0 ? "var(--mistral-amber)" : "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {decision ? `${severity.toFixed(1)}/3.0` : "0.0/3.0"}
          </span>
        </div>
      </div>

      {/* Reasoning Note */}
      {decision?.reasoning && (
        <div
          style={{
            background: "var(--bg-canvas)",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-light)",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            <Brain size={14} color="var(--jev-emerald)" />
            Jev System One Rationalization
          </div>
          {decision.reasoning}
        </div>
      )}
    </div>
  );
};
