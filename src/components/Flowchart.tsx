"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { PipelineNodeId, TargetModel } from "@/lib/types";
import { ArrowRight, Bot, Cpu, ShieldAlert, Sparkles, Terminal, CheckCircle2, Loader2 } from "lucide-react";

interface FlowchartProps {
  activeNode: PipelineNodeId | null;
  targetModel?: TargetModel;
  latencyMs?: number;
  statusMessage?: string;
}

export const Flowchart: React.FC<FlowchartProps> = ({
  activeNode,
  targetModel,
  latencyMs,
  statusMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP animation on active node changes
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      if (activeNode) {
        gsap.fromTo(
          `#node-${activeNode}`,
          { scale: 0.96, opacity: 0.85 },
          { scale: 1.03, opacity: 1, duration: 0.35, ease: "back.out(2)" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [activeNode]);

  const isIngestActive = activeNode === "input";
  const isRouterActive = activeNode === "router";
  const isMistralActive = activeNode === "mistral" || (activeNode === "output" && targetModel === "mistral_large");
  const isGeminiActive = activeNode === "gemini" || (activeNode === "output" && targetModel === "gemini_flash_pro");
  const isSecurityActive = activeNode === "security";
  const isOutputActive = activeNode === "output";

  return (
    <div className="card-panel flowchart-section" ref={containerRef}>
      {/* Header */}
      <div className="flowchart-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="panel-icon-badge" style={{ background: "rgba(5, 150, 105, 0.1)", color: "var(--jev-emerald)" }}>
            <Cpu size={17} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="section-title">Realtime LangGraph Autonomous Pipeline Flow</span>
              <span className="live-status-pill">
                <span className="status-dot" style={{ width: 6, height: 6 }} />
                Active Conduit
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "1px" }}>
              Dynamic state graph execution with ~150ms TypeSafe Jev routing
            </p>
          </div>
        </div>

        <div className="flowchart-status-ticker">
          <span className="ticker-label">State Message:</span>
          <span className="ticker-value">{statusMessage || "Waiting for execution..."}</span>
        </div>
      </div>

      {/* Main Flowchart Pipeline Canvas */}
      <div className="flowchart-stage-canvas">
        {/* ============================================================
            STEP 1: INGEST NODE
           ============================================================ */}
        <div
          id="node-input"
          className={`pipeline-node ${isIngestActive ? "active-blue" : ""}`}
        >
          <div className="node-top-bar">
            <span className="node-step-tag">Step 1</span>
            {isIngestActive && <Loader2 size={12} className="spin-icon" color="var(--gemini-blue)" />}
          </div>
          <div className="node-body">
            <div className="node-icon-box" style={{ background: "rgba(15, 23, 42, 0.06)", color: "var(--text-primary)" }}>
              <Terminal size={16} />
            </div>
            <div>
              <div className="node-title">User Prompt</div>
              <div className="node-desc">State Ingestion</div>
            </div>
          </div>
          <div className="node-footer">
            <span className="node-status-text">
              {isIngestActive ? "Ingesting Prompt..." : "Prompt Ingest"}
            </span>
          </div>
        </div>

        {/* Conduit 1: Ingest -> Router */}
        <div className={`pipeline-conduit ${isIngestActive || isRouterActive ? "conduit-active" : ""}`}>
          <div className="conduit-line">
            <div className="conduit-pulse" />
          </div>
          <ArrowRight size={15} className="conduit-arrow" />
        </div>

        {/* ============================================================
            STEP 2: JEV ROUTER NODE
           ============================================================ */}
        <div
          id="node-router"
          className={`pipeline-node ${isRouterActive ? "active-emerald" : ""}`}
        >
          <div className="node-top-bar">
            <span className="node-step-tag" style={{ color: "var(--jev-emerald)" }}>Step 2 • Router</span>
            {isRouterActive && <Loader2 size={12} className="spin-icon" color="var(--jev-emerald)" />}
          </div>
          <div className="node-body">
            <div className="node-icon-box" style={{ background: "var(--jev-emerald-light)", color: "var(--jev-emerald)" }}>
              <Cpu size={16} />
            </div>
            <div>
              <div className="node-title" style={{ color: "var(--jev-emerald)" }}>Jev System One</div>
              <div className="node-desc">Noul / Score / Choice</div>
            </div>
          </div>
          <div className="node-footer">
            <span className="node-status-text">
              {isRouterActive ? "Evaluating ~150ms..." : "Calibrated Routing"}
            </span>
          </div>
        </div>

        {/* Conduit 2: Router -> Worker Stack */}
        <div className={`pipeline-conduit ${isRouterActive || isMistralActive || isGeminiActive || isSecurityActive ? "conduit-active" : ""}`}>
          <div className="conduit-line">
            <div className="conduit-pulse" />
          </div>
          <ArrowRight size={15} className="conduit-arrow" />
        </div>

        {/* ============================================================
            STEP 3: MULTI-MODEL WORKERS STACK
           ============================================================ */}
        <div className="workers-stack">
          {/* Worker A: Mistral Large */}
          <div
            id="node-mistral"
            className={`worker-subnode ${isMistralActive ? "active-amber" : ""}`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <div className="node-icon-box" style={{ background: "var(--mistral-amber-light)", color: "var(--mistral-amber)", width: 26, height: 26 }}>
                <Bot size={14} />
              </div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Mistral Large
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Code, Logic & Syntax
                </div>
              </div>
            </div>
            <span className="worker-badge" style={{ background: "var(--mistral-amber-light)", color: "var(--mistral-amber)" }}>
              {isMistralActive ? (activeNode === "output" ? "Used" : "Active") : "Branch A"}
            </span>
          </div>

          {/* Worker B: Google Gemini */}
          <div
            id="node-gemini"
            className={`worker-subnode ${isGeminiActive ? "active-blue" : ""}`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <div className="node-icon-box" style={{ background: "var(--gemini-blue-light)", color: "var(--gemini-blue)", width: 26, height: 26 }}>
                <Sparkles size={14} />
              </div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Google Gemini
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Creative & Synthesis
                </div>
              </div>
            </div>
            <span className="worker-badge" style={{ background: "var(--gemini-blue-light)", color: "var(--gemini-blue)" }}>
              {isGeminiActive ? (activeNode === "output" ? "Used" : "Active") : "Branch B"}
            </span>
          </div>

          {/* Worker C: Security Firewall */}
          <div
            id="node-security"
            className={`worker-subnode ${isSecurityActive ? "active-red" : ""}`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <div className="node-icon-box" style={{ background: "var(--security-red-light)", color: "var(--security-red)", width: 26, height: 26 }}>
                <ShieldAlert size={14} />
              </div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Security Guard
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  DAN & Jailbreak Wall
                </div>
              </div>
            </div>
            <span className="worker-badge" style={{ background: "var(--security-red-light)", color: "var(--security-red)" }}>
              {isSecurityActive ? "Blocked" : "Branch C"}
            </span>
          </div>
        </div>

        {/* Conduit 3: Workers -> Output */}
        <div className={`pipeline-conduit ${isOutputActive ? "conduit-active" : ""}`}>
          <div className="conduit-line">
            <div className="conduit-pulse" />
          </div>
          <ArrowRight size={15} className="conduit-arrow" />
        </div>

        {/* ============================================================
            STEP 4: OUTPUT NODE
           ============================================================ */}
        <div
          id="node-output"
          className={`pipeline-node ${isOutputActive ? "active-blue" : ""}`}
        >
          <div className="node-top-bar">
            <span className="node-step-tag">Step 4 • Output</span>
            {isOutputActive && <CheckCircle2 size={13} color="var(--jev-emerald)" />}
          </div>
          <div className="node-body">
            <div className="node-icon-box" style={{ background: "rgba(15, 23, 42, 0.06)", color: "var(--text-primary)" }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div className="node-title">Synthesized Answer</div>
              <div className="node-desc">Markdown & Metrics</div>
            </div>
          </div>
          <div className="node-footer">
            <span className="node-status-text" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {latencyMs ? `${latencyMs}ms total` : isOutputActive ? "Ready" : "Waiting"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
