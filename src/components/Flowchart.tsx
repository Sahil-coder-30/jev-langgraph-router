"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { PipelineNodeId, TargetModel } from "@/lib/types";
import {
  ArrowRight,
  Bot,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  CheckCircle2,
  Loader2,
  GitFork,
  Check
} from "lucide-react";

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
        const node = `#node-${activeNode}`;
        gsap.fromTo(
          node,
          { scale: 0.95, opacity: 0.7, y: 6 },
          { scale: 1.02, opacity: 1, y: 0, duration: 0.38, ease: "back.out(2)" }
        );
        gsap.fromTo(
          ".conduit-active .conduit-pulse",
          { xPercent: -100 },
          { xPercent: 100, duration: 0.75, ease: "none" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [activeNode]);

  const isIngestActive = activeNode === "input";
  const isRouterActive = activeNode === "router";
  const isMistralActive =
    activeNode === "mistral" ||
    (activeNode === "output" && targetModel === "mistral_large") ||
    targetModel === "mistral_large";
  const isGeminiActive =
    activeNode === "gemini" ||
    (activeNode === "output" && targetModel === "gemini_flash_pro") ||
    targetModel === "gemini_flash_pro";
  const isSecurityActive =
    activeNode === "security" ||
    (activeNode === "output" && targetModel === "blocked") ||
    targetModel === "blocked";
  const isGuardActive = activeNode === "guard";
  const isOutputActive = activeNode === "output";

  return (
    <div className="card-panel flowchart-section" ref={containerRef}>
      {/* Header */}
      <div className="flowchart-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            className="panel-icon-badge"
            style={{
              background: "rgba(5, 150, 105, 0.1)",
              color: "var(--jev-emerald)",
            }}
          >
            <GitFork size={17} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="section-title">LangGraph Pipeline Flow</span>
              <span className="live-status-pill">
                <span className="status-dot" style={{ width: 6, height: 6 }} />
                Interactive Engine
              </span>
            </div>
            <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "1px" }}>
              Dynamic 3-way routing with Jev System One & fail-closed output verification
            </p>
          </div>
        </div>

        <div className="flowchart-status-ticker">
          <span className="ticker-label">State:</span>
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
            {isIngestActive && <Loader2 size={11} className="spin-icon" color="var(--gemini-blue)" />}
          </div>
          <div className="node-body">
            <div
              className="node-icon-box"
              style={{ background: "rgba(15, 23, 42, 0.06)", color: "var(--text-primary)" }}
            >
              <Terminal size={14} />
            </div>
            <div className="node-info">
              <div className="node-title">User Prompt</div>
              <div className="node-desc">State Ingestion</div>
            </div>
          </div>
          <div className="node-footer">
            <span className="node-status-text">
              {isIngestActive ? "Ingesting..." : "Prompt Ingest"}
            </span>
          </div>
        </div>

        {/* Conduit 1: Ingest -> Router */}
        <div className={`pipeline-conduit single-conduit ${isIngestActive || isRouterActive ? "conduit-active" : ""}`}>
          <div className="conduit-line">
            <div className="conduit-pulse" />
          </div>
          <ArrowRight size={13} className="conduit-arrow" />
        </div>

        {/* ============================================================
            STEP 2: JEV ROUTER NODE
           ============================================================ */}
        <div
          id="node-router"
          className={`pipeline-node ${isRouterActive ? "active-emerald" : ""}`}
        >
          <div className="node-top-bar">
            <span className="node-step-tag" style={{ color: "var(--jev-emerald)" }}>
              Step 2 • Router
            </span>
            {isRouterActive && <Loader2 size={11} className="spin-icon" color="var(--jev-emerald)" />}
          </div>
          <div className="node-body">
            <div
              className="node-icon-box"
              style={{ background: "var(--jev-emerald-light)", color: "var(--jev-emerald)" }}
            >
              <Cpu size={14} />
            </div>
            <div className="node-info">
              <div className="node-title" style={{ color: "var(--jev-emerald)" }}>
                Jev System One
              </div>
              <div className="node-desc">Multi-Branch Classifier</div>
            </div>
          </div>
          <div className="node-footer">
            <span className="node-status-text">
              {isRouterActive ? "Routing..." : "3-Way Decision"}
            </span>
          </div>
        </div>

        {/* ============================================================
            3 DISTINCT BRANCHING ARROWS AFTER THE ROUTER
           ============================================================ */}
        <div className="router-branch-fork-container" aria-label="3-Way Branching Conduits">
          {/* Top Arrow -> Mistral Large */}
          <div
            className={`branch-conduit branch-top ${
              (isRouterActive || isMistralActive) ? "conduit-active branch-active-amber" : ""
            }`}
            title="Branch A: Routing to Mistral Large"
          >
            <div className="branch-line-track">
              <div className="branch-pulse" />
            </div>
            <div className="branch-arrowhead-box">
              <span className="branch-code-tag">A</span>
              <ArrowRight size={12} className="branch-arrow-icon" />
            </div>
          </div>

          {/* Middle Arrow -> Google Gemini */}
          <div
            className={`branch-conduit branch-mid ${
              (isRouterActive || isGeminiActive) ? "conduit-active branch-active-blue" : ""
            }`}
            title="Branch B: Routing to Google Gemini"
          >
            <div className="branch-line-track">
              <div className="branch-pulse" />
            </div>
            <div className="branch-arrowhead-box">
              <span className="branch-code-tag">B</span>
              <ArrowRight size={12} className="branch-arrow-icon" />
            </div>
          </div>

          {/* Bottom Arrow -> Security Guard Wall */}
          <div
            className={`branch-conduit branch-bot ${
              (isRouterActive || isSecurityActive) ? "conduit-active branch-active-red" : ""
            }`}
            title="Branch C: Routing to Security Wall"
          >
            <div className="branch-line-track">
              <div className="branch-pulse" />
            </div>
            <div className="branch-arrowhead-box">
              <span className="branch-code-tag">C</span>
              <ArrowRight size={12} className="branch-arrow-icon" />
            </div>
          </div>
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
            <div className="worker-left-meta">
              <div
                className="node-icon-box"
                style={{
                  background: "var(--mistral-amber-light)",
                  color: "var(--mistral-amber)",
                }}
              >
                <Bot size={13} />
              </div>
              <div className="worker-info">
                <div className="worker-title">Mistral Large</div>
                <div className="worker-desc">Technical & Code Reasoning</div>
              </div>
            </div>
            <span
              className="worker-badge"
              style={{
                background: "var(--mistral-amber-light)",
                color: "var(--mistral-amber)",
                border: "1px solid var(--mistral-amber-border)",
              }}
            >
              {isMistralActive ? (targetModel === "mistral_large" ? "Target" : "Active") : "A"}
            </span>
          </div>

          {/* Worker B: Google Gemini */}
          <div
            id="node-gemini"
            className={`worker-subnode ${isGeminiActive ? "active-blue" : ""}`}
          >
            <div className="worker-left-meta">
              <div
                className="node-icon-box"
                style={{
                  background: "var(--gemini-blue-light)",
                  color: "var(--gemini-blue)",
                }}
              >
                <Sparkles size={13} />
              </div>
              <div className="worker-info">
                <div className="worker-title">Google Gemini</div>
                <div className="worker-desc">Synthesis & Creative</div>
              </div>
            </div>
            <span
              className="worker-badge"
              style={{
                background: "var(--gemini-blue-light)",
                color: "var(--gemini-blue)",
                border: "1px solid var(--gemini-blue-border)",
              }}
            >
              {isGeminiActive ? (targetModel === "gemini_flash_pro" ? "Target" : "Active") : "B"}
            </span>
          </div>

          {/* Worker C: Security Guard */}
          <div
            id="node-security"
            className={`worker-subnode ${isSecurityActive ? "active-red" : ""}`}
          >
            <div className="worker-left-meta">
              <div
                className="node-icon-box"
                style={{
                  background: "var(--security-red-light)",
                  color: "var(--security-red)",
                }}
              >
                <ShieldAlert size={13} />
              </div>
              <div className="worker-info">
                <div className="worker-title">Security Guard</div>
                <div className="worker-desc">DAN & Threat Wall</div>
              </div>
            </div>
            <span
              className="worker-badge"
              style={{
                background: "var(--security-red-light)",
                color: "var(--security-red)",
                border: "1px solid var(--security-red-border)",
              }}
            >
              {isSecurityActive ? "Blocked" : "C"}
            </span>
          </div>
        </div>

        {/* Conduit 3: Workers -> Output Guard Convergence */}
        <div
          className={`pipeline-conduit ${
            isMistralActive || isGeminiActive || isGuardActive ? "conduit-active" : ""
          }`}
        >
          <div className="conduit-line">
            <div className="conduit-pulse" />
          </div>
          <ArrowRight size={13} className="conduit-arrow" />
        </div>

        {/* ============================================================
            STEP 4: OUTPUT GUARD NODE
           ============================================================ */}
        <div
          id="node-guard"
          className={`pipeline-node guard-node ${isGuardActive ? "active-emerald" : ""}`}
        >
          <div className="node-top-bar">
            <span className="node-step-tag" style={{ color: "var(--jev-emerald)" }}>
              Step 4 • Verify
            </span>
            {isGuardActive ? (
              <Loader2 size={11} className="spin-icon" color="var(--jev-emerald)" />
            ) : (
              <ShieldCheck size={12} color="var(--jev-emerald)" />
            )}
          </div>
          <div className="node-body">
            <div className="node-icon-box guard-icon">
              <ShieldCheck size={14} />
            </div>
            <div className="node-info">
              <div className="node-title">Output Guard</div>
              <div className="node-desc">Policy Verification</div>
            </div>
          </div>
          <div className="node-footer">
            <span className="node-status-text">
              {isGuardActive ? "Verifying..." : "Fail-Closed Check"}
            </span>
          </div>
        </div>

        {/* Conduit 4: Guard -> Output */}
        <div
          className={`pipeline-conduit ${
            isGuardActive || isOutputActive ? "conduit-active" : ""
          }`}
        >
          <div className="conduit-line">
            <div className="conduit-pulse" />
          </div>
          <ArrowRight size={13} className="conduit-arrow" />
        </div>

        {/* ============================================================
            STEP 5: SYNTHESIZED OUTPUT NODE
           ============================================================ */}
        <div
          id="node-output"
          className={`pipeline-node ${isOutputActive ? "active-blue" : ""}`}
        >
          <div className="node-top-bar">
            <span className="node-step-tag">Step 5 • Output</span>
            {isOutputActive && <CheckCircle2 size={12} color="var(--jev-emerald)" />}
          </div>
          <div className="node-body">
            <div
              className="node-icon-box"
              style={{ background: "rgba(15, 23, 42, 0.06)", color: "var(--text-primary)" }}
            >
              <Sparkles size={14} />
            </div>
            <div className="node-info">
              <div className="node-title">Synthesized Output</div>
              <div className="node-desc">Markdown & Metrics</div>
            </div>
          </div>
          <div className="node-footer">
            <span
              className="node-status-text"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
            >
              {latencyMs ? `${latencyMs}ms total` : isOutputActive ? "Ready" : "Waiting"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
