"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { JevOutputGuardDecision, JevRoutingDecision, PipelineNodeId } from "@/lib/types";
import { Activity, BrainCircuit, CheckCircle2, CircleAlert, GitBranch, Radar, ShieldCheck, Timer } from "lucide-react";

interface JevAnalyticsProps {
  decision: JevRoutingDecision | null;
  outputGuard?: JevOutputGuardDecision;
  activeNode: PipelineNodeId | null;
  isLoading: boolean;
}

const pct = (value: number) => `${Math.round(value * 100)}%`;

export const JevAnalytics: React.FC<JevAnalyticsProps> = ({ decision, outputGuard, activeNode, isLoading }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const mistral = decision?.probabilities.mistral_large ?? 0;
  const gemini = decision?.probabilities.gemini_flash_pro ?? 0;
  const confidence = decision?.confidence ?? 0;
  const guardChecking = isLoading && activeNode === "guard";
  const guardPassed = outputGuard?.allowed;
  const guardValue = outputGuard ? outputGuard.policyViolationProb : 0;

  useEffect(() => {
    if (!panelRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(".jev-rail-item", { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.38, stagger: 0.055, ease: "power3.out" });
      if (isLoading) gsap.to(".jev-live-orb", { scale: 1.35, opacity: 0.22, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, panelRef);
    return () => context.revert();
  }, [decision, outputGuard, isLoading]);

  return (
    <aside className="jev-observability-rail" ref={panelRef} aria-label="Jev decision analysis">
      <div className="jev-rail-header jev-rail-item">
        <div className="jev-rail-kicker"><Radar size={13} /> LIVE SYSTEM ONE TRACE</div>
        <div className="jev-rail-title-row"><div><h2>Jev Decision Console</h2><p>Typed judgments, not generated reasoning</p></div><div className={`jev-live-indicator ${isLoading ? "is-live" : ""}`}><span className="jev-live-orb" /> {isLoading ? "STREAMING" : "READY"}</div></div>
      </div>

      <section className="jev-decision-map jev-rail-item">
        <div className="jev-section-label"><GitBranch size={14} /> ROUTER DISTRIBUTION</div>
        <div className="jev-routing-summary"><div className="jev-confidence-ring" style={{ "--ring-progress": `${Math.max(6, confidence * 100)}%` } as React.CSSProperties}><div><strong>{decision ? pct(confidence) : "--"}</strong><span>certainty</span></div></div><div className="jev-route-readout"><span>Selected path</span><strong>{decision?.targetModel === "blocked" ? "BLOCKED" : decision?.targetModel === "mistral_large" ? "MISTRAL" : decision ? "GEMINI" : "AWAITING INPUT"}</strong><small>{decision ? `${decision.latencyMs}ms Jev inference` : "Run a question to inspect"}</small></div></div>
        <ProbabilityBar label="Mistral / technical" value={mistral} tone="mistral" />
        <ProbabilityBar label="Gemini / general Q&A" value={gemini} tone="gemini" />
      </section>

      <section className="jev-guard-card jev-rail-item">
        <div className="jev-section-label"><ShieldCheck size={14} /> OUTPUT GUARDRAIL</div>
        <div className={`jev-guard-verdict ${guardChecking ? "checking" : guardPassed === false ? "blocked" : guardPassed ? "passed" : "idle"}`}>{guardChecking ? <Activity size={20} className="spin-icon" /> : guardPassed === false ? <CircleAlert size={20} /> : <CheckCircle2 size={20} />}<div><strong>{guardChecking ? "Verifying response" : guardPassed === false ? "Response withheld" : guardPassed ? "Response approved" : "Standing by"}</strong><span>{guardChecking ? "Jev is checking the provider output" : outputGuard?.reasoning || "A second Jev judgment runs after generation."}</span></div></div>
        <div className="jev-guard-meter"><div><span>Policy-violation probability</span><strong>{outputGuard ? pct(guardValue) : "--"}</strong></div><div className="jev-meter-track"><i style={{ width: outputGuard ? `${guardValue * 100}%` : "0%" }} /></div></div>
      </section>

      <section className="jev-safety-grid jev-rail-item"><div><span>Jailbreak</span><strong className={(decision?.safety.jailbreakProb ?? 0) > 0.5 ? "danger" : "safe"}>{decision ? pct(decision.safety.jailbreakProb) : "--"}</strong></div><div><span>Severity</span><strong>{decision ? `${decision.safety.severityScore.toFixed(1)} / 3` : "--"}</strong></div><div><span>Guard time</span><strong>{outputGuard ? `${outputGuard.latencyMs}ms` : "--"}</strong></div></section>

      <section className="jev-trace-note jev-rail-item"><BrainCircuit size={16} /><div><span>WHY THIS PATH</span><p>{decision?.reasoning || "The router will expose its selected path and calibrated probabilities here."}</p></div></section>
      <div className="jev-rail-foot jev-rail-item"><Timer size={13} /> Input gate → provider → independent output gate</div>
    </aside>
  );
};

function ProbabilityBar({ label, value, tone }: { label: string; value: number; tone: "mistral" | "gemini" }) {
  return <div className="jev-prob-row"><div><span>{label}</span><strong>{value ? pct(value) : "--"}</strong></div><div className={`jev-prob-track ${tone}`}><i style={{ width: `${value * 100}%` }} /></div></div>;
}
