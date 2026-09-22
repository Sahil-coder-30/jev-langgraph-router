"use client";

import React from "react";
import { Cpu, Zap, ShieldAlert, Target, Award, Activity, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export interface JevGameEvaluationData {
  advantage: {
    choice: "human_win" | "bot_win" | "draw_balanced";
    confidence: number;
    probabilities: {
      human_win: number;
      bot_win: number;
      draw_balanced: number;
    };
  };
  forkThreat: number;
  tensionScore: number;
  tensionProbabilities?: Record<string, number>;
  strategy: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  latencyMs: number;
  model: string;
  moveCount: number;
  evaluatedAt: number;
}

interface JevGameDashboardProps {
  evaluation: JevGameEvaluationData | null;
  isLoading: boolean;
  board: (string | null)[];
}

export const JevGameDashboard: React.FC<JevGameDashboardProps> = ({
  evaluation,
  isLoading,
  board,
}) => {
  const humanProb = Math.round((evaluation?.advantage.probabilities.human_win ?? 0.33) * 100);
  const botProb = Math.round((evaluation?.advantage.probabilities.bot_win ?? 0.33) * 100);
  const drawProb = Math.max(0, 100 - humanProb - botProb);

  const forkThreatPct = Math.round((evaluation?.forkThreat ?? 0.15) * 100);
  const tensionScore = evaluation?.tensionScore ?? 1.0;
  const latencyMs = evaluation?.latencyMs ?? 0;

  const strategyChoice = evaluation?.strategy.choice || "tempo_corner";
  const strategyFormatted = strategyChoice
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const isLethal = forkThreatPct >= 50;

  return (
    <div className="card-panel jev-game-dashboard">
      {/* Header */}
      <div className="jev-game-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div className="panel-icon-badge" style={{ background: "rgba(5, 150, 105, 0.12)", color: "var(--jev-emerald)" }}>
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 className="section-title" style={{ fontSize: "0.95rem" }}>
                Jev Model Probability Dashboard
              </h3>
              <span className="live-status-pill">
                <span className="status-dot" style={{ width: 6, height: 6 }} />
                TypeSafe System One
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
              Real-time multi-dimensional board state evaluation & tactical foresight
            </p>
          </div>
        </div>

        <div className="flowchart-status-ticker">
          <Activity size={12} color="var(--jev-emerald)" />
          <span className="ticker-label">Inference:</span>
          <span className="ticker-value">{latencyMs > 0 ? `${latencyMs}ms` : "Live"}</span>
        </div>
      </div>

      {/* Main Grid: Advantage Meter + Threat Gauges */}
      <div className="jev-game-body-grid">
        {/* Card 1: 3-Way Tactical Advantage Probability */}
        <div className="jev-game-card">
          <div className="jev-game-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Award size={14} color="var(--gemini-blue)" />
              <span className="jev-card-title">Match Advantage Probability</span>
            </div>
            <span className="jev-model-tag">{evaluation?.model || "Jev Model"}</span>
          </div>

          {/* Tri-color Stacked Bar */}
          <div className="jev-advantage-bar-track">
            <div
              className="jev-bar-segment seg-human"
              style={{ width: `${humanProb}%` }}
              title={`Player Win: ${humanProb}%`}
            />
            <div
              className="jev-bar-segment seg-bot"
              style={{ width: `${botProb}%` }}
              title={`AI Bot Win: ${botProb}%`}
            />
            <div
              className="jev-bar-segment seg-draw"
              style={{ width: `${drawProb}%` }}
              title={`Draw / Stalemate: ${drawProb}%`}
            />
          </div>

          {/* 3 Metric Badges */}
          <div className="jev-advantage-stats-row">
            <div className="advantage-stat-box box-human">
              <span className="stat-sublabel">You (X)</span>
              <strong className="stat-pct">{humanProb}%</strong>
              <span className="stat-hint">Win Chance</span>
            </div>
            <div className="advantage-stat-box box-bot">
              <span className="stat-sublabel">Bot (O)</span>
              <strong className="stat-pct">{botProb}%</strong>
              <span className="stat-hint">Win Chance</span>
            </div>
            <div className="advantage-stat-box box-draw">
              <span className="stat-sublabel">Stalemate</span>
              <strong className="stat-pct">{drawProb}%</strong>
              <span className="stat-hint">Draw Chance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fork Hazard & Tactical Tension */}
        <div className="jev-game-card">
          <div className="jev-game-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Zap size={14} color="var(--mistral-amber)" />
              <span className="jev-card-title">Tactical Threat & Tension</span>
            </div>
            <span className={`threat-badge ${isLethal ? "threat-danger" : "threat-safe"}`}>
              {isLethal ? "High Danger" : "Stable Position"}
            </span>
          </div>

          {/* Fork Threat Progress Bar */}
          <div className="jev-gauge-row">
            <div className="gauge-label-row">
              <span className="gauge-label">
                <ShieldAlert size={12} style={{ display: "inline", marginRight: 4 }} />
                Imminent Fork / Win Threat
              </span>
              <strong className="gauge-val" style={{ color: isLethal ? "var(--security-red)" : "var(--text-primary)" }}>
                {forkThreatPct}%
              </strong>
            </div>
            <div className="meter-track" style={{ height: 7 }}>
              <div
                className="meter-fill"
                style={{
                  width: `${forkThreatPct}%`,
                  background: isLethal
                    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                    : "linear-gradient(90deg, #10b981, #3b82f6)",
                }}
              />
            </div>
          </div>

          {/* Tactical Tension Score */}
          <div className="jev-gauge-row" style={{ marginTop: "0.75rem" }}>
            <div className="gauge-label-row">
              <span className="gauge-label">
                <Target size={12} style={{ display: "inline", marginRight: 4 }} />
                Board Tension Index
              </span>
              <strong className="gauge-val">{tensionScore.toFixed(1)} / 3.0</strong>
            </div>
            <div className="tension-pills-row">
              {["Low (0.0)", "Moderate (1.0)", "High (2.0)", "Decisive (3.0)"].map((lvl, i) => {
                const isActive = tensionScore >= i && tensionScore < i + 1;
                return (
                  <span
                    key={lvl}
                    className={`tension-pill ${isActive ? "active-pill" : ""}`}
                  >
                    {lvl}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Jev Strategic Recommendation & Raw State Vector */}
      <div className="jev-strategy-strip">
        <div className="strategy-left">
          <div className="strategy-tag-badge">
            <Target size={13} />
            <span>Optimal Jev Strategy</span>
          </div>
          <div className="strategy-readout">
            <span className="strategy-choice">{strategyFormatted}</span>
            <span className="strategy-desc">
              {strategyChoice === "block_threat"
                ? "Immediate defensive priority: Intercept opponent fork alignment."
                : strategyChoice === "create_fork"
                ? "Offensive priority: Construct two simultaneous winning paths."
                : strategyChoice === "center_anchor"
                ? "Positional priority: Control center hub for 4 diagonal winning lines."
                : "Positional priority: Seize corners to eliminate opponent branching."}
            </span>
          </div>
        </div>

        {/* State Telemetry Footnote */}
        <div className="state-telemetry-box">
          <div className="telemetry-header">
            <Layers size={11} />
            <span>Jev System One State Vector</span>
          </div>
          <div className="telemetry-values">
            <span>Move: <strong>#{board.filter((c) => c !== null).length}</strong></span>
            <span>X: <strong>{board.filter((c) => c === "X").length}</strong></span>
            <span>O: <strong>{board.filter((c) => c === "O").length}</strong></span>
            <span>Free: <strong>{board.filter((c) => c === null).length}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
